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

    const reviewPeriods = await prisma.reviewPeriod.findMany({
      orderBy: [
        { year: 'desc' },
        { type: 'asc' }
      ],
      include: {
        _count: {
          select: { reviews: true }
        }
      }
    })

    return NextResponse.json({ reviewPeriods })
  } catch (error) {
    console.error('Error fetching review periods:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { year, type, startDate, endDate } = body

    // Check if period already exists
    const existingPeriod = await prisma.reviewPeriod.findUnique({
      where: {
        year_type: { year, type }
      }
    })

    if (existingPeriod) {
      return NextResponse.json({ error: 'Review period already exists' }, { status: 400 })
    }

    const reviewPeriod = await prisma.reviewPeriod.create({
      data: {
        year,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'PLANNED'
      }
    })

    return NextResponse.json({ reviewPeriod })
  } catch (error) {
    console.error('Error creating review period:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}