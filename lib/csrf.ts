import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

export function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

export async function getCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(CSRF_COOKIE_NAME);
  
  if (existingToken?.value) {
    return existingToken.value;
  }
  
  const newToken = generateCSRFToken();
  await setCSRFToken(newToken);
  return newToken;
}

export async function setCSRFToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

export async function validateCSRFToken(request: NextRequest): Promise<boolean> {
  // Skip CSRF validation for GET and HEAD requests
  if (request.method === 'GET' || request.method === 'HEAD') {
    return true;
  }
  
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (!headerToken) {
    return false;
  }
  
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME);
  
  if (!cookieToken?.value) {
    return false;
  }
  
  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(headerToken),
    Buffer.from(cookieToken.value)
  );
}

export function csrfProtection() {
  return async (request: NextRequest) => {
    const isValid = await validateCSRFToken(request);
    
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid CSRF token' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return null; // Continue with the request
  };
}