import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

interface Params {
  params: Promise<{
    id: string
    action: string
  }>
}

export async function PATCH(request: NextRequest, { params }: Params) {
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

    const { id, action } = await params

    // Get the review period
    const reviewPeriod = await prisma.reviewPeriod.findUnique({
      where: { id }
    })

    if (!reviewPeriod) {
      return NextResponse.json({ error: 'Review period not found' }, { status: 404 })
    }

    let updateData: any = {}
    
    switch (action) {
      case 'open':
        if (reviewPeriod.status !== 'PLANNED') {
          return NextResponse.json({ error: 'Can only open planned periods' }, { status: 400 })
        }
        updateData = {
          status: 'OPEN',
          openedBy: user.id,
          openedAt: new Date()
        }
        
        // Create reviews for all active employees when opening a period
        await createReviewsForPeriod(id)
        break
        
      case 'close':
        if (reviewPeriod.status !== 'OPEN') {
          return NextResponse.json({ error: 'Can only close open periods' }, { status: 400 })
        }
        updateData = {
          status: 'CLOSED',
          closedBy: user.id,
          closedAt: new Date()
        }
        break
        
      case 'archive':
        if (reviewPeriod.status !== 'CLOSED') {
          return NextResponse.json({ error: 'Can only archive closed periods' }, { status: 400 })
        }
        updateData = {
          status: 'ARCHIVED'
        }
        
        // Mark all reviews as archived
        await prisma.review.updateMany({
          where: { reviewPeriodId: id },
          data: { isArchived: true }
        })
        break
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const updatedPeriod = await prisma.reviewPeriod.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ reviewPeriod: updatedPeriod })
  } catch (error) {
    console.error(`Error processing review period action:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function createReviewsForPeriod(reviewPeriodId: string) {
  // Get all active employees with supervisors
  const employees = await prisma.user.findMany({
    where: {
      role: 'EMPLOYEE',
      isActive: true,
      supervisorId: { not: null }
    }
  })

  // Create reviews for each employee
  const reviewsToCreate = employees.map(employee => ({
    reviewPeriodId,
    employeeId: employee.id,
    supervisorId: employee.supervisorId!,
    phase: 'SELF_EVALUATION' as const
  }))

  // Create reviews one by one to avoid duplicates
  for (const reviewData of reviewsToCreate) {
    try {
      await prisma.review.create({
        data: reviewData
      })
    } catch (error: any) {
      // If it's a unique constraint error, just skip it (review already exists)
      if (error.code === 'P2002') {
        console.log(`Review already exists for employee ${reviewData.employeeId} in period ${reviewData.reviewPeriodId}`)
        continue
      }
      throw error
    }
  }

  // Create competencies for each review
  const createdReviews = await prisma.review.findMany({
    where: { reviewPeriodId }
  })

  for (const review of createdReviews) {
    const competencyTypes = ['DOSTARCZANIE', 'ROZWOJ', 'INNOWACYJNOSC', 'ODWAGA', 'ODPORNOSC'] as const
    
    const competenciesToCreate = competencyTypes.map(type => ({
      reviewId: review.id,
      type
    }))

    // Create competencies one by one to avoid duplicates
    for (const compData of competenciesToCreate) {
      try {
        await prisma.competency.create({
          data: compData
        })
      } catch (error: any) {
        // If it's a unique constraint error, just skip it (competency already exists)
        if (error.code === 'P2002') {
          console.log(`Competency ${compData.type} already exists for review ${compData.reviewId}`)
          continue
        }
        throw error
      }
    }
  }
}