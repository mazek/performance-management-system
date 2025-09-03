import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/api-middleware';
import { Permission } from '@/lib/permissions';
import { logRoleChange } from '@/lib/audit';
import { z } from 'zod';

const roleUpdateSchema = z.object({
  role: z.enum(['ADMIN', 'HR', 'SUPERVISOR', 'EMPLOYEE']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check permission
  const session = await requirePermission(request, Permission.ASSIGN_ROLES);
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const { role } = roleUpdateSchema.parse(body);
    const { id: targetUserId } = await params;

    // Get current user role
    const currentUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { role: true, email: true, firstName: true, lastName: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent self-demotion for the last admin
    if (targetUserId === session.userId && currentUser.role === 'ADMIN' && role !== 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last admin role' },
          { status: 400 }
        );
      }
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        role,
        roleAssignedBy: `${session.email}`,
        roleAssignedById: session.userId,
        roleAssignedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        position: true,
        roleAssignedBy: true,
        roleAssignedAt: true,
      },
    });

    // Log the role change
    await logRoleChange(
      session.userId,
      targetUserId,
      currentUser.role,
      role,
      request
    );

    return NextResponse.json({
      user: updatedUser,
      message: `Role updated successfully for ${currentUser.firstName} ${currentUser.lastName}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid role specified', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Role update error:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}