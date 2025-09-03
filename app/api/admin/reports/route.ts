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

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all'
    const department = searchParams.get('department') || 'all'

    // Build filters
    const reviewFilter: Record<string, any> = {}
    const userFilter: Record<string, any> = {}

    if (period !== 'all') {
      reviewFilter.reviewPeriodId = period
    }

    if (department !== 'all') {
      userFilter.department = department
    }

    // Get basic stats
    const totalEmployees = await prisma.user.count({
      where: { isActive: true, ...userFilter }
    })

    const reviews = await prisma.review.findMany({
      where: {
        ...reviewFilter,
        employee: userFilter.department ? { department: userFilter.department } : undefined
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            department: true
          }
        },
        goals: true,
        competencies: true
      }
    })

    const totalReviews = reviews.length
    const completedReviews = reviews.filter(r => r.phase === 'COMPLETED').length
    const pendingReviews = totalReviews - completedReviews

    // Calculate average score from goals and competencies
    const reviewsWithScores = reviews.filter(r => 
      r.goals.some(g => g.finalRating !== null) || 
      r.competencies.some(c => c.finalRating !== null)
    )
    
    const averageScore = reviewsWithScores.length > 0 
      ? reviewsWithScores.reduce((sum, r) => {
          const goalScores = r.goals.filter(g => g.finalRating !== null).map(g => g.finalRating!)
          const compScores = r.competencies.filter(c => c.finalRating !== null).map(c => c.finalRating!)
          const allScores = [...goalScores, ...compScores]
          const reviewScore = allScores.length > 0 ? allScores.reduce((s, score) => s + score, 0) / allScores.length : 0
          return sum + reviewScore
        }, 0) / reviewsWithScores.length
      : 0

    // Department statistics
    const departmentStatsQuery = await prisma.user.groupBy({
      by: ['department'],
      where: { 
        isActive: true,
        ...(department !== 'all' ? { department } : {})
      },
      _count: {
        id: true
      }
    })

    const departmentStats = await Promise.all(
      departmentStatsQuery.map(async (dept) => {
        const deptReviews = await prisma.review.findMany({
          where: {
            ...reviewFilter,
            employee: {
              department: dept.department,
              isActive: true
            }
          },
          include: {
            goals: true,
            competencies: true
          }
        })

        const deptCompletedReviews = deptReviews.filter(r => r.phase === 'COMPLETED')
        const deptReviewsWithScores = deptCompletedReviews.filter(r =>
          r.goals.some(g => g.finalRating !== null) || 
          r.competencies.some(c => c.finalRating !== null)
        )
        
        const deptAvgScore = deptReviewsWithScores.length > 0
          ? deptReviewsWithScores.reduce((sum, r) => {
              const goalScores = r.goals.filter(g => g.finalRating !== null).map(g => g.finalRating!)
              const compScores = r.competencies.filter(c => c.finalRating !== null).map(c => c.finalRating!)
              const allScores = [...goalScores, ...compScores]
              const reviewScore = allScores.length > 0 ? allScores.reduce((s, score) => s + score, 0) / allScores.length : 0
              return sum + reviewScore
            }, 0) / deptReviewsWithScores.length
          : 0

        return {
          department: dept.department || 'Not Assigned',
          totalEmployees: dept._count.id,
          completedReviews: deptCompletedReviews.length,
          averageScore: deptAvgScore
        }
      })
    )

    // Review period statistics
    const reviewPeriods = await prisma.reviewPeriod.findMany({
      include: {
        _count: {
          select: {
            reviews: true
          }
        },
        reviews: {
          where: department !== 'all' ? {
            employee: { department }
          } : undefined
        }
      },
      orderBy: [
        { year: 'desc' },
        { type: 'asc' }
      ]
    })

    const reviewPeriodStats = reviewPeriods.map(period => {
      const completedInPeriod = period.reviews.filter(r => r.phase === 'COMPLETED').length
      return {
        id: period.id,
        year: period.year,
        type: period.type,
        status: period.status,
        totalReviews: period.reviews.length,
        completedReviews: completedInPeriod,
        completionRate: period.reviews.length > 0 
          ? Math.round((completedInPeriod / period.reviews.length) * 100)
          : 0
      }
    })

    // Phase distribution
    const phaseDistribution = await prisma.review.groupBy({
      by: ['phase'],
      where: {
        ...reviewFilter,
        employee: userFilter.department ? { department: userFilter.department } : undefined
      },
      _count: {
        phase: true
      }
    })

    const phaseDistributionFormatted = phaseDistribution.map(phase => ({
      phase: phase.phase,
      count: phase._count.phase
    }))

    // Top performers - calculate from goals and competencies
    const completedReviewsForPerformers = reviews.filter(r => r.phase === 'COMPLETED')
    
    // Group by employee and calculate average scores
    const employeeScores = new Map()
    completedReviewsForPerformers.forEach(review => {
      const employeeId = review.employee.id
      if (!employeeScores.has(employeeId)) {
        employeeScores.set(employeeId, {
          employee: review.employee,
          scores: []
        })
      }
      
      // Calculate review score from goals and competencies
      const goalScores = review.goals.filter(g => g.finalRating !== null).map(g => g.finalRating!)
      const compScores = review.competencies.filter(c => c.finalRating !== null).map(c => c.finalRating!)
      const allScores = [...goalScores, ...compScores]
      
      if (allScores.length > 0) {
        const reviewScore = allScores.reduce((sum, score) => sum + score, 0) / allScores.length
        employeeScores.get(employeeId).scores.push(reviewScore)
      }
    })

    const topPerformers = Array.from(employeeScores.entries())
      .filter(([_, data]) => data.scores.length > 0) // Only include employees with scores
      .map(([employeeId, data]) => ({
        id: employeeId,
        firstName: data.employee.firstName,
        lastName: data.employee.lastName,
        department: data.employee.department || 'Not Assigned',
        averageScore: data.scores.reduce((sum: number, score: number) => sum + score, 0) / data.scores.length
      }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 10)

    // Review trends (monthly completion data for current year)
    const currentYear = new Date().getFullYear()
    const monthlyData = await prisma.review.findMany({
      where: {
        phase: 'COMPLETED',
        updatedAt: {
          gte: new Date(`${currentYear}-01-01`),
          lt: new Date(`${currentYear + 1}-01-01`)
        },
        employee: userFilter.department ? { department: userFilter.department } : undefined
      },
      select: {
        updatedAt: true
      }
    })

    const reviewTrends = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(currentYear, i, 1).toLocaleDateString('en', { month: 'short' })
      const monthReviews = monthlyData.filter(r => r.updatedAt.getMonth() === i)
      return {
        month,
        completed: monthReviews.length,
        total: monthReviews.length // For now, using completed as total
      }
    })

    const reports = {
      totalEmployees,
      totalReviews,
      completedReviews,
      pendingReviews,
      averageScore,
      departmentStats,
      reviewPeriodStats,
      phaseDistribution: phaseDistributionFormatted,
      topPerformers,
      reviewTrends
    }

    return NextResponse.json({ reports })

  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}