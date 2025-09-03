import { prisma } from './prisma';
import { AuthProvider } from '@prisma/client';

export interface DeletionPolicy {
  deactivateOnly: boolean;           // Just mark as inactive
  reassignToManager: boolean;        // Reassign subordinates to user's manager
  anonymizeAfterDays?: number;       // Anonymize PII after X days
  archiveAfterDays?: number;         // Move to archive table after X days
  deleteAfterDays?: number;          // Hard delete after X days (if allowed)
}

const defaultPolicy: DeletionPolicy = {
  deactivateOnly: true,
  reassignToManager: true,
  anonymizeAfterDays: 365,          // Anonymize after 1 year
  archiveAfterDays: 730,            // Archive after 2 years
  deleteAfterDays: undefined        // Never hard delete by default
};

/**
 * Handle user deletion/deactivation from AD
 */
export async function handleADUserDeletion(
  userId: string,
  policy: DeletionPolicy = defaultPolicy
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subordinates: true,
      supervisor: true,
      reviewsAsEmployee: true
    }
  });

  if (!user) return;

  // Step 1: Deactivate the user
  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: false,
      deactivatedAt: new Date(),
      deactivationReason: 'AD_ACCOUNT_DELETED'
    }
  });

  // Step 2: Reassign subordinates to user's manager
  if (policy.reassignToManager && user.subordinates.length > 0) {
    const newSupervisorId = user.supervisorId;
    
    for (const subordinate of user.subordinates) {
      await prisma.user.update({
        where: { id: subordinate.id },
        data: {
          supervisorId: newSupervisorId,
          supervisorChangedAt: new Date(),
          supervisorChangedReason: 'MANAGER_DEACTIVATED'
        }
      });
    }

    // Log the reassignment
    await prisma.auditLog.create({
      data: {
        userId: 'SYSTEM',
        action: 'SUBORDINATES_REASSIGNED',
        entityType: 'USER',
        entityId: userId,
        details: JSON.stringify({
          subordinateCount: user.subordinates.length,
          newSupervisorId,
          reason: 'AD account deleted'
        })
      }
    });
  }

  // Step 3: Handle in-progress reviews
  const activeReviews = await prisma.review.findMany({
    where: {
      OR: [
        { employeeId: userId, phase: { not: 'COMPLETED' } },
        { supervisorId: userId, phase: { not: 'COMPLETED' } }
      ]
    }
  });

  for (const review of activeReviews) {
    if (review.employeeId === userId) {
      // Mark employee's reviews as incomplete
      await prisma.review.update({
        where: { id: review.id },
        data: {
          status: 'INCOMPLETE',
          incompleteReason: 'Employee account deactivated from AD'
        }
      });
    }
    
    if (review.supervisorId === userId && user.supervisorId) {
      // Reassign review to user's manager
      await prisma.review.update({
        where: { id: review.id },
        data: {
          supervisorId: user.supervisorId,
          supervisorChangedAt: new Date()
        }
      });
    }
  }
}

/**
 * Scheduled job to handle long-term deletion policy
 */
export async function processDeactivatedUsers(
  policy: DeletionPolicy = defaultPolicy
): Promise<void> {
  const now = new Date();

  // Anonymize old deactivated users
  if (policy.anonymizeAfterDays) {
    const anonymizeCutoff = new Date(
      now.getTime() - policy.anonymizeAfterDays * 24 * 60 * 60 * 1000
    );

    const usersToAnonymize = await prisma.user.findMany({
      where: {
        isActive: false,
        deactivatedAt: { lte: anonymizeCutoff },
        isAnonymized: false
      }
    });

    for (const user of usersToAnonymize) {
      await anonymizeUser(user.id);
    }
  }

  // Archive very old deactivated users
  if (policy.archiveAfterDays) {
    const archiveCutoff = new Date(
      now.getTime() - policy.archiveAfterDays * 24 * 60 * 60 * 1000
    );

    const usersToArchive = await prisma.user.findMany({
      where: {
        isActive: false,
        deactivatedAt: { lte: archiveCutoff },
        isArchived: false
      }
    });

    for (const user of usersToArchive) {
      await archiveUser(user.id);
    }
  }

  // Hard delete if policy allows (use with caution!)
  if (policy.deleteAfterDays) {
    const deleteCutoff = new Date(
      now.getTime() - policy.deleteAfterDays * 24 * 60 * 60 * 1000
    );

    const usersToDelete = await prisma.user.findMany({
      where: {
        isActive: false,
        deactivatedAt: { lte: deleteCutoff },
        isArchived: true,
        reviewsAsEmployee: { none: {} }  // Only if no reviews exist
      }
    });

    for (const user of usersToDelete) {
      await hardDeleteUser(user.id);
    }
  }
}

/**
 * Anonymize user's personal information
 */
async function anonymizeUser(userId: string): Promise<void> {
  const anonymizedEmail = `deleted-${userId}@anonymous.local`;
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: anonymizedEmail,
      firstName: 'Deleted',
      lastName: 'User',
      employeeId: `DELETED-${userId.substring(0, 8)}`,
      department: null,
      position: null,
      externalId: null,
      isAnonymized: true,
      anonymizedAt: new Date()
    }
  });

  // Log anonymization
  await prisma.auditLog.create({
    data: {
      userId: 'SYSTEM',
      action: 'USER_ANONYMIZED',
      entityType: 'USER',
      entityId: userId,
      details: JSON.stringify({
        reason: 'Deletion policy - data retention period expired'
      })
    }
  });
}

/**
 * Archive user data
 */
async function archiveUser(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      reviewsAsEmployee: true,
      reviewsAsSupervisor: true
    }
  });

  if (!user) return;

  // Create archive record
  await prisma.archivedUser.create({
    data: {
      originalId: user.id,
      userData: JSON.stringify(user),
      archivedAt: new Date(),
      reviewCount: user.reviewsAsEmployee.length
    }
  });

  // Mark user as archived
  await prisma.user.update({
    where: { id: userId },
    data: {
      isArchived: true,
      archivedAt: new Date()
    }
  });
}

/**
 * Permanently delete user (use with extreme caution!)
 */
async function hardDeleteUser(userId: string): Promise<void> {
  // Only delete if user has no associated reviews
  const reviewCount = await prisma.review.count({
    where: {
      OR: [
        { employeeId: userId },
        { supervisorId: userId }
      ]
    }
  });

  if (reviewCount > 0) {
    console.warn(`Cannot hard delete user ${userId}: Has ${reviewCount} associated reviews`);
    return;
  }

  // Delete audit logs
  await prisma.auditLog.deleteMany({
    where: { userId }
  });

  // Delete login attempts
  await prisma.loginAttempt.deleteMany({
    where: { userId }
  });

  // Finally, delete the user
  await prisma.user.delete({
    where: { id: userId }
  });

  console.log(`Hard deleted user ${userId}`);
}

/**
 * Get deletion statistics
 */
export async function getDeletionStatistics(): Promise<{
  deactivated: number;
  anonymized: number;
  archived: number;
  totalActive: number;
}> {
  const [deactivated, anonymized, archived, totalActive] = await Promise.all([
    prisma.user.count({ where: { isActive: false } }),
    prisma.user.count({ where: { isAnonymized: true } }),
    prisma.user.count({ where: { isArchived: true } }),
    prisma.user.count({ where: { isActive: true } })
  ]);

  return {
    deactivated,
    anonymized,
    archived,
    totalActive
  };
}