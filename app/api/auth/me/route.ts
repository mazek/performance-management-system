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

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      employeeId: true,
      department: true,
      position: true,
      role: true,
      supervisor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      subordinates: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          department: true,
          position: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'Użytkownik nie znaleziony' },
      { status: 404 }
    );
  }

  return NextResponse.json({ user });
}