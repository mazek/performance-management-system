import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ActiveDirectoryService, getADConfig } from '@/lib/active-directory';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check admin privileges
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get AD configuration
    const adConfig = await getADConfig();
    
    if (!adConfig || !adConfig.enabled) {
      return NextResponse.json({ 
        error: 'Active Directory is not configured. Please configure AD settings first.' 
      }, { status: 400 });
    }

    // Perform AD sync
    const adService = new ActiveDirectoryService(adConfig);
    const result = await adService.syncUsers();

    // Log the sync operation
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'AD_SYNC',
        entityType: 'USER',
        details: JSON.stringify(result),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Active Directory sync completed',
      ...result
    });

  } catch (error) {
    console.error('AD sync error:', error);
    return NextResponse.json({ 
      error: 'Failed to sync with Active Directory',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to check AD configuration status
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check admin privileges
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !['ADMIN', 'HR'].includes(user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get AD configuration
    const adConfig = await getADConfig();
    
    if (!adConfig) {
      return NextResponse.json({
        configured: false,
        enabled: false,
        message: 'Active Directory is not configured'
      });
    }

    // Count AD users
    const adUserCount = await prisma.user.count({
      where: { authProvider: 'ACTIVE_DIRECTORY' }
    });

    const activeAdUserCount = await prisma.user.count({
      where: { 
        authProvider: 'ACTIVE_DIRECTORY',
        isActive: true
      }
    });

    return NextResponse.json({
      configured: true,
      enabled: adConfig.enabled,
      domain: adConfig.domain,
      url: adConfig.url,
      baseDN: adConfig.baseDN,
      totalUsers: adUserCount,
      activeUsers: activeAdUserCount,
      lastSync: await getLastSyncTime()
    });

  } catch (error) {
    console.error('Error checking AD status:', error);
    return NextResponse.json({ 
      error: 'Failed to check AD status' 
    }, { status: 500 });
  }
}

async function getLastSyncTime(): Promise<Date | null> {
  const lastSync = await prisma.auditLog.findFirst({
    where: { action: 'AD_SYNC' },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true }
  });
  
  return lastSync?.createdAt || null;
}