import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, setSession } from '@/lib/auth';
import { getErrorMessage } from '@/lib/serverTranslations';
import { Language } from '@/lib/translations';
import { z } from 'zod';
import { isAccountLocked, trackFailedLogin, trackSuccessfulLogin } from '@/lib/account-lockout';
import { extractRequestInfo } from '@/lib/audit';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(5),
  language: z.enum(['pl', 'en']).optional(),
});

export async function POST(request: NextRequest) {
  let body: any;
  let language: Language = 'pl';
  const { ipAddress } = extractRequestInfo(request);

  try {
    body = await request.json();
    language = body.language || 'pl';
    
    const { email, password } = loginSchema.parse(body);
    
    // Check if account is locked
    const lockStatus = await isAccountLocked(email);
    if (lockStatus.isLocked) {
      return NextResponse.json(
        { 
          error: `Account is locked. Please try again in ${lockStatus.remainingLockTime} minutes.`,
          remainingLockTime: lockStatus.remainingLockTime 
        },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !await verifyPassword(password, user.password)) {
      // Track failed login attempt
      await trackFailedLogin(email, ipAddress);
      
      // Check if this failed attempt triggered a lockout
      const lockStatusAfter = await isAccountLocked(email);
      
      if (lockStatusAfter.isLocked) {
        return NextResponse.json(
          { 
            error: `Too many failed attempts. Account is locked for ${lockStatusAfter.remainingLockTime} minutes.`,
            remainingLockTime: lockStatusAfter.remainingLockTime 
          },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { 
          error: getErrorMessage(language, 'invalidCredentials'),
          attemptsRemaining: lockStatusAfter.attemptsRemaining 
        },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: getErrorMessage(language, 'accountInactive') },
        { status: 403 }
      );
    }

    // Track successful login
    await trackSuccessfulLogin(user.id, user.email, ipAddress);
    
    await setSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        position: user.position,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: getErrorMessage(language, 'invalidData'), details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Login error:', error);
    return NextResponse.json(
      { error: getErrorMessage(language, 'loginError') },
      { status: 500 }
    );
  }
}