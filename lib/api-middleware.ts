import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './auth';
import { hasPermission, Permission } from './permissions';
import { createAuditLog, extractRequestInfo } from './audit';

export interface ApiSession {
  userId: string;
  email: string;
  role: string;
}

// Middleware to check authentication
export async function requireAuth(request: NextRequest): Promise<ApiSession | NextResponse> {
  const session = await getSession();
  
  if (!session || !session.userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  return session as ApiSession;
}

// Middleware to check specific permission
export async function requirePermission(
  request: NextRequest,
  permission: Permission
): Promise<ApiSession | NextResponse> {
  const session = await requireAuth(request);
  
  if (session instanceof NextResponse) {
    return session; // Return auth error
  }
  
  if (!hasPermission(session.role, permission)) {
    // Log unauthorized access attempt
    const { ipAddress, userAgent } = extractRequestInfo(request);
    await createAuditLog({
      userId: session.userId,
      action: 'UNAUTHORIZED_ACCESS',
      details: {
        permission,
        path: request.nextUrl.pathname,
      },
      ipAddress,
      userAgent,
    });
    
    return NextResponse.json(
      { error: 'Forbidden - Insufficient permissions' },
      { status: 403 }
    );
  }
  
  return session;
}

// Middleware to check multiple permissions (any)
export async function requireAnyPermission(
  request: NextRequest,
  permissions: Permission[]
): Promise<ApiSession | NextResponse> {
  const session = await requireAuth(request);
  
  if (session instanceof NextResponse) {
    return session;
  }
  
  const hasAnyPermission = permissions.some(permission => 
    hasPermission(session.role, permission)
  );
  
  if (!hasAnyPermission) {
    const { ipAddress, userAgent } = extractRequestInfo(request);
    await createAuditLog({
      userId: session.userId,
      action: 'UNAUTHORIZED_ACCESS',
      details: {
        requiredPermissions: permissions,
        path: request.nextUrl.pathname,
      },
      ipAddress,
      userAgent,
    });
    
    return NextResponse.json(
      { error: 'Forbidden - Insufficient permissions' },
      { status: 403 }
    );
  }
  
  return session;
}

// Middleware to check all permissions
export async function requireAllPermissions(
  request: NextRequest,
  permissions: Permission[]
): Promise<ApiSession | NextResponse> {
  const session = await requireAuth(request);
  
  if (session instanceof NextResponse) {
    return session;
  }
  
  const hasAllPerms = permissions.every(permission => 
    hasPermission(session.role, permission)
  );
  
  if (!hasAllPerms) {
    const { ipAddress, userAgent } = extractRequestInfo(request);
    await createAuditLog({
      userId: session.userId,
      action: 'UNAUTHORIZED_ACCESS',
      details: {
        requiredPermissions: permissions,
        path: request.nextUrl.pathname,
      },
      ipAddress,
      userAgent,
    });
    
    return NextResponse.json(
      { error: 'Forbidden - Insufficient permissions' },
      { status: 403 }
    );
  }
  
  return session;
}

// Check if user owns a resource
export async function requireOwnership(
  request: NextRequest,
  resourceOwnerId: string
): Promise<ApiSession | NextResponse> {
  const session = await requireAuth(request);
  
  if (session instanceof NextResponse) {
    return session;
  }
  
  if (session.userId !== resourceOwnerId) {
    return NextResponse.json(
      { error: 'Forbidden - You do not own this resource' },
      { status: 403 }
    );
  }
  
  return session;
}

// Check if user is supervisor of another user
export async function requireSupervisorOf(
  request: NextRequest,
  subordinateId: string
): Promise<ApiSession | NextResponse> {
  const session = await requireAuth(request);
  
  if (session instanceof NextResponse) {
    return session;
  }
  
  // Check if user is supervisor of the subordinate
  const { prisma } = await import('./prisma');
  const subordinate = await prisma.user.findFirst({
    where: {
      id: subordinateId,
      supervisorId: session.userId,
    },
  });
  
  if (!subordinate) {
    return NextResponse.json(
      { error: 'Forbidden - You are not the supervisor of this user' },
      { status: 403 }
    );
  }
  
  return session;
}