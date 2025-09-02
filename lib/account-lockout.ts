import { prisma } from './prisma';

interface LockoutConfig {
  maxAttempts: number;
  lockoutDuration: number; // in minutes
  resetWindow: number; // in minutes
}

const defaultConfig: LockoutConfig = {
  maxAttempts: 5,
  lockoutDuration: 30, // 30 minutes
  resetWindow: 15, // Reset attempt counter after 15 minutes of no attempts
};

// Track failed login attempts
export async function trackFailedLogin(email: string, ipAddress?: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });
    
    if (!user) return; // Don't track attempts for non-existent users
    
    await prisma.loginAttempt.create({
      data: {
        userId: user.id,
        email,
        ipAddress: ipAddress || 'unknown',
        success: false,
        attemptedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error tracking failed login:', error);
  }
}

// Track successful login
export async function trackSuccessfulLogin(userId: string, email: string, ipAddress?: string): Promise<void> {
  try {
    await prisma.loginAttempt.create({
      data: {
        userId,
        email,
        ipAddress: ipAddress || 'unknown',
        success: true,
        attemptedAt: new Date()
      }
    });
    
    // Clear failed attempts on successful login
    await clearFailedAttempts(userId);
  } catch (error) {
    console.error('Error tracking successful login:', error);
  }
}

// Check if account is locked
export async function isAccountLocked(email: string, config: LockoutConfig = defaultConfig): Promise<{
  isLocked: boolean;
  remainingLockTime?: number;
  attemptsRemaining?: number;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });
    
    if (!user) {
      return { isLocked: false };
    }
    
    const now = new Date();
    const resetWindowStart = new Date(now.getTime() - config.resetWindow * 60 * 1000);
    
    // Get recent failed attempts within the reset window
    const recentAttempts = await prisma.loginAttempt.findMany({
      where: {
        userId: user.id,
        success: false,
        attemptedAt: {
          gte: resetWindowStart
        }
      },
      orderBy: {
        attemptedAt: 'desc'
      }
    });
    
    if (recentAttempts.length === 0) {
      return { 
        isLocked: false,
        attemptsRemaining: config.maxAttempts 
      };
    }
    
    // Check if account should be locked
    if (recentAttempts.length >= config.maxAttempts) {
      const lastAttempt = recentAttempts[0];
      const lockoutEnd = new Date(lastAttempt.attemptedAt.getTime() + config.lockoutDuration * 60 * 1000);
      
      if (now < lockoutEnd) {
        const remainingLockTime = Math.ceil((lockoutEnd.getTime() - now.getTime()) / 1000 / 60);
        return {
          isLocked: true,
          remainingLockTime
        };
      }
    }
    
    return {
      isLocked: false,
      attemptsRemaining: config.maxAttempts - recentAttempts.length
    };
  } catch (error) {
    console.error('Error checking account lock status:', error);
    return { isLocked: false };
  }
}

// Clear failed attempts for a user
async function clearFailedAttempts(userId: string): Promise<void> {
  try {
    await prisma.loginAttempt.deleteMany({
      where: {
        userId,
        success: false
      }
    });
  } catch (error) {
    console.error('Error clearing failed attempts:', error);
  }
}

// Unlock account manually (admin action)
export async function unlockAccount(email: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });
    
    if (!user) return false;
    
    await clearFailedAttempts(user.id);
    return true;
  } catch (error) {
    console.error('Error unlocking account:', error);
    return false;
  }
}

// Get login attempt history for a user
export async function getLoginHistory(email: string, limit: number = 20): Promise<any[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });
    
    if (!user) return [];
    
    return await prisma.loginAttempt.findMany({
      where: { userId: user.id },
      orderBy: { attemptedAt: 'desc' },
      take: limit,
      select: {
        email: true,
        ipAddress: true,
        success: true,
        attemptedAt: true
      }
    });
  } catch (error) {
    console.error('Error getting login history:', error);
    return [];
  }
}

// Clean up old login attempts (to be run periodically)
export async function cleanupOldLoginAttempts(daysToKeep: number = 30): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    await prisma.loginAttempt.deleteMany({
      where: {
        attemptedAt: {
          lt: cutoffDate
        }
      }
    });
  } catch (error) {
    console.error('Error cleaning up old login attempts:', error);
  }
}