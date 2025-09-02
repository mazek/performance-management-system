import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Nie jesteś zalogowany' },
      { status: 401 }
    );
  }

  try {
    // Get archived parameter from query string
    const { searchParams } = new URL(request.url);
    const showArchived = searchParams.get('archived') === 'true';

    let reviews;
    
    const baseWhere = {
      isArchived: showArchived
    };

    if (session.role === 'HR' || session.role === 'ADMIN') {
      // HR and Admin can see all reviews
      reviews = await prisma.review.findMany({
        where: baseWhere,
        include: {
          reviewPeriod: {
            select: {
              year: true,
              type: true,
              status: true,
            }
          },
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: true,
            },
          },
          supervisor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          goals: true,
          competencies: true,
        },
        orderBy: [
          { reviewPeriod: { year: 'desc' } },
          { reviewPeriod: { type: 'desc' } },
          { createdAt: 'desc' }
        ],
      });
    } else {
      // Regular users see their own reviews and reviews they supervise
      reviews = await prisma.review.findMany({
        where: {
          ...baseWhere,
          OR: [
            { employeeId: session.userId },
            { supervisorId: session.userId },
          ],
        },
        include: {
          reviewPeriod: {
            select: {
              year: true,
              type: true,
              status: true,
            }
          },
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: true,
            },
          },
          supervisor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          goals: true,
          competencies: true,
        },
        orderBy: [
          { reviewPeriod: { year: 'desc' } },
          { reviewPeriod: { type: 'desc' } },
          { createdAt: 'desc' }
        ],
      });
    }

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania ocen' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Nie jesteś zalogowany' },
      { status: 401 }
    );
  }

  if (session.role !== 'HR' && session.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Brak uprawnień' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { employeeId, supervisorId, year, period } = body;

    // Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: {
        employeeId,
        year,
        period,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'Ocena dla tego okresu już istnieje' },
        { status: 400 }
      );
    }

    // Create review with default competencies
    const review = await prisma.review.create({
      data: {
        employeeId,
        supervisorId,
        year,
        period,
        competencies: {
          create: [
            { type: 'DOSTARCZANIE' },
            { type: 'ROZWOJ' },
            { type: 'INNOWACYJNOSC' },
            { type: 'ODWAGA' },
            { type: 'ODPORNOSC' },
          ],
        },
      },
      include: {
        employee: true,
        supervisor: true,
        competencies: true,
      },
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia oceny' },
      { status: 500 }
    );
  }
}