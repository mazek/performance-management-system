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

    // Get total employees
    const totalEmployees = await prisma.user.count({
      where: {
        role: 'EMPLOYEE',
        isActive: true
      }
    })

    // Get all reviews with review periods
    const allReviews = await prisma.review.findMany({
      include: {
        employee: {
          select: {
            department: true
          }
        },
        reviewPeriod: {
          select: {
            status: true
          }
        }
      }
    })

    // Calculate basic stats
    const totalReviews = allReviews.length
    const activeReviews = allReviews.filter(r => !r.isArchived && r.phase !== 'COMPLETED').length
    const completedReviews = allReviews.filter(r => r.phase === 'COMPLETED').length

    // Count overdue evaluations (for now, just count pending ones)
    const overdueSelfEvaluations = allReviews.filter(r => 
      r.phase === 'SELF_EVALUATION' && !r.isArchived
    ).length

    const overdueSupervisorEvaluations = allReviews.filter(r => 
      r.phase === 'SUPERVISOR_EVALUATION' && !r.isArchived
    ).length

    // Reviews by phase
    const reviewsByPhase = allReviews.reduce((acc, review) => {
      acc[review.phase] = (acc[review.phase] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Ensure all phases are represented
    const phases = ['NOT_STARTED', 'SELF_EVALUATION', 'SUPERVISOR_EVALUATION', 'FINAL_MEETING', 'COMPLETED']
    phases.forEach(phase => {
      if (!reviewsByPhase[phase]) {
        reviewsByPhase[phase] = 0
      }
    })

    // Reviews by department
    const departmentMap = new Map<string, { total: number, completed: number }>()
    
    allReviews.forEach(review => {
      const dept = review.employee.department || 'Unknown'
      
      if (!departmentMap.has(dept)) {
        departmentMap.set(dept, { total: 0, completed: 0 })
      }
      
      const deptStats = departmentMap.get(dept)!
      deptStats.total++
      
      if (review.phase === 'COMPLETED') {
        deptStats.completed++
      }
    })

    const reviewsByDepartment = Array.from(departmentMap.entries()).map(([department, stats]) => ({
      department,
      total: stats.total,
      completed: stats.completed,
      pending: stats.total - stats.completed
    }))

    // Current periods
    const currentPeriods = await prisma.reviewPeriod.findMany({
      where: {
        status: { in: ['OPEN', 'CLOSED'] }
      },
      include: {
        _count: {
          select: { reviews: true }
        },
        reviews: {
          select: { phase: true }
        }
      },
      orderBy: [
        { year: 'desc' },
        { type: 'desc' }
      ]
    })

    const formattedPeriods = currentPeriods.map(period => ({
      id: period.id,
      year: period.year,
      type: period.type,
      status: period.status,
      totalReviews: period._count.reviews,
      completedReviews: period.reviews.filter(r => r.phase === 'COMPLETED').length
    }))

    const stats = {
      totalEmployees,
      totalReviews,
      activeReviews,
      completedReviews,
      overdueSelfEvaluations,
      overdueSupervisorEvaluations,
      reviewsByPhase,
      reviewsByDepartment,
      currentPeriods: formattedPeriods
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}