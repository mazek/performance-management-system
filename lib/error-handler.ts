import { NextResponse } from 'next/server';

interface ErrorResponse {
  error: string;
  details?: any;
  requestId?: string;
}

// Generate a request ID for tracking
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Sanitize error messages for production
export function sanitizeError(error: any, requestId?: string): ErrorResponse {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Log the full error internally
  console.error(`[${requestId || 'unknown'}] Error:`, error);
  
  // In development, return full error details
  if (isDevelopment) {
    return {
      error: error?.message || 'An error occurred',
      details: error?.stack || error,
      requestId
    };
  }
  
  // In production, return sanitized errors
  // Check for known error types
  if (error?.code === 'P2002') {
    return {
      error: 'A record with this value already exists',
      requestId
    };
  }
  
  if (error?.code === 'P2025') {
    return {
      error: 'Record not found',
      requestId
    };
  }
  
  if (error?.name === 'ValidationError') {
    return {
      error: 'Invalid input data provided',
      requestId
    };
  }
  
  if (error?.name === 'UnauthorizedError') {
    return {
      error: 'Authentication required',
      requestId
    };
  }
  
  if (error?.name === 'ForbiddenError') {
    return {
      error: 'Access denied',
      requestId
    };
  }
  
  // Default sanitized message
  return {
    error: 'An error occurred processing your request. Please try again later.',
    requestId
  };
}

// Create standardized error responses
export function createErrorResponse(
  error: any,
  statusCode: number = 500,
  requestId?: string
): NextResponse {
  const sanitized = sanitizeError(error, requestId);
  
  return NextResponse.json(sanitized, { 
    status: statusCode,
    headers: {
      'X-Request-Id': requestId || 'unknown'
    }
  });
}

// Wrapper for API route handlers with error handling
export function withErrorHandler(
  handler: (req: Request, context?: any) => Promise<Response>
) {
  return async (req: Request, context?: any): Promise<Response> => {
    const requestId = generateRequestId();
    
    try {
      // Add request ID to headers for tracking
      const response = await handler(req, context);
      response.headers.set('X-Request-Id', requestId);
      return response;
    } catch (error) {
      // Determine appropriate status code
      let statusCode = 500;
      
      if (error instanceof Error) {
        if (error.message.includes('Unauthorized') || error.message.includes('authenticated')) {
          statusCode = 401;
        } else if (error.message.includes('Forbidden') || error.message.includes('Access denied')) {
          statusCode = 403;
        } else if (error.message.includes('not found')) {
          statusCode = 404;
        } else if (error.message.includes('Invalid') || error.message.includes('Validation')) {
          statusCode = 400;
        }
      }
      
      return createErrorResponse(error, statusCode, requestId);
    }
  };
}

// Custom error classes
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}