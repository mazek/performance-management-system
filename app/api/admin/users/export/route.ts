import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user and check admin privileges
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user || !['ADMIN', 'HR'].includes(user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      where: {
        isActive: true
      },
      include: {
        supervisor: {
          select: {
            employeeId: true
          }
        }
      },
      orderBy: [
        { department: 'asc' },
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    })

    // Create CSV content
    const headers = [
      'firstName',
      'lastName', 
      'email',
      'employeeId',
      'department',
      'position',
      'role',
      'supervisorEmployeeId',
      'isActive',
      'createdAt'
    ]

    const csvRows = [
      headers.join(','), // Header row
      ...users.map(user => [
        `"${user.firstName}"`,
        `"${user.lastName}"`,
        `"${user.email}"`,
        `"${user.employeeId}"`,
        `"${user.department || ''}"`,
        `"${user.position || ''}"`,
        user.role,
        `"${user.supervisor?.employeeId || ''}"`,
        user.isActive,
        user.createdAt.toISOString()
      ].join(','))
    ]

    const csvContent = csvRows.join('\n')

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Error exporting CSV:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}