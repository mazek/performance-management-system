import { prisma } from './prisma';
import { NextRequest } from 'next/server';

export enum AuditAction {
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  
  // User Management
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ACTIVATED = 'USER_ACTIVATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  
  // Role Management
  ROLE_ASSIGNED = 'ROLE_ASSIGNED',
  ROLE_REMOVED = 'ROLE_REMOVED',
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_REVOKED = 'PERMISSION_REVOKED',
  
  // Review Management
  REVIEW_CREATED = 'REVIEW_CREATED',
  REVIEW_UPDATED = 'REVIEW_UPDATED',
  REVIEW_DELETED = 'REVIEW_DELETED',
  REVIEW_PHASE_CHANGED = 'REVIEW_PHASE_CHANGED',
  REVIEW_SUBMITTED = 'REVIEW_SUBMITTED',
  
  // System Configuration
  CONFIG_UPDATED = 'CONFIG_UPDATED',
  AUTH_PROVIDER_ENABLED = 'AUTH_PROVIDER_ENABLED',
  AUTH_PROVIDER_DISABLED = 'AUTH_PROVIDER_DISABLED',
  
  // Data Export
  DATA_EXPORTED = 'DATA_EXPORTED',
  REPORT_GENERATED = 'REPORT_GENERATED',
}

export enum EntityType {
  USER = 'USER',
  REVIEW = 'REVIEW',
  ROLE = 'ROLE',
  CONFIG = 'CONFIG',
  AUTH_PROVIDER = 'AUTH_PROVIDER',
}

interface AuditLogEntry {
  userId: string;
  action: AuditAction;
  entityType?: EntityType;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

// Create audit log entry
export async function createAuditLog(entry: AuditLogEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        details: entry.details ? JSON.stringify(entry.details) : null,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the application
  }
}

// Extract IP and user agent from request
export function extractRequestInfo(request: NextRequest) {
  const ipAddress = 
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';
    
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return { ipAddress, userAgent };
}

// Log authentication events
export async function logAuthEvent(
  userId: string,
  action: AuditAction.LOGIN | AuditAction.LOGOUT | AuditAction.LOGIN_FAILED,
  request: NextRequest,
  details?: any
) {
  const { ipAddress, userAgent } = extractRequestInfo(request);
  
  await createAuditLog({
    userId,
    action,
    details,
    ipAddress,
    userAgent,
  });
}

// Log user management events
export async function logUserManagement(
  performedBy: string,
  action: AuditAction,
  targetUserId: string,
  details?: any,
  request?: NextRequest
) {
  const requestInfo = request ? extractRequestInfo(request) : {};
  
  await createAuditLog({
    userId: performedBy,
    action,
    entityType: EntityType.USER,
    entityId: targetUserId,
    details,
    ...requestInfo,
  });
}

// Log role changes
export async function logRoleChange(
  performedBy: string,
  targetUserId: string,
  oldRole: string,
  newRole: string,
  request?: NextRequest
) {
  const requestInfo = request ? extractRequestInfo(request) : {};
  
  await createAuditLog({
    userId: performedBy,
    action: AuditAction.ROLE_ASSIGNED,
    entityType: EntityType.USER,
    entityId: targetUserId,
    details: {
      oldRole,
      newRole,
      changedBy: performedBy,
    },
    ...requestInfo,
  });
}

// Query audit logs
export async function getAuditLogs(filters?: {
  userId?: string;
  action?: AuditAction;
  entityType?: EntityType;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const where: any = {};
  
  if (filters?.userId) where.userId = filters.userId;
  if (filters?.action) where.action = filters.action;
  if (filters?.entityType) where.entityType = filters.entityType;
  if (filters?.entityId) where.entityId = filters.entityId;
  
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }
  
  return prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: filters?.limit || 100,
  });
}