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

    // Get available review periods
    const reviewPeriods = await prisma.reviewPeriod.findMany({
      orderBy: [
        { year: 'desc' },
        { type: 'asc' }
      ]
    })

    const periods = reviewPeriods.map(period => ({
      id: period.id,
      label: `${period.year} - ${period.type === 'MID_YEAR' ? 'Mid-Year' : 'End-Year'}`
    }))

    // Get available departments
    const departmentsData = await prisma.user.findMany({
      where: {
        isActive: true,
        department: { not: null }
      },
      select: {
        department: true
      },
      distinct: ['department']
    })

    const departments = departmentsData
      .map(d => d.department!)
      .filter(Boolean)
      .sort()

    return NextResponse.json({ periods, departments })

  } catch (error) {
    console.error('Error fetching filter options:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}