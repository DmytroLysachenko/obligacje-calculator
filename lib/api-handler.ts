import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { headers } from 'next/headers';

// Simple in-memory rate-limiter stub
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_MAX = 100; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const limitData = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  if (now - limitData.lastReset > RATE_LIMIT_WINDOW) {
    limitData.count = 1;
    limitData.lastReset = now;
  } else {
    limitData.count++;
  }

  rateLimitMap.set(ip, limitData);
  
  return {
    success: limitData.count <= RATE_LIMIT_MAX,
    limit: RATE_LIMIT_MAX,
    remaining: Math.max(0, RATE_LIMIT_MAX - limitData.count),
    reset: limitData.lastReset + RATE_LIMIT_WINDOW
  };
}

export type ApiHandler = (req: NextRequest, ...args: any[]) => Promise<NextResponse> | NextResponse;

/**
 * Standardized API Route Handler wrapper.
 * Implements:
 * - Basic IP-based rate limiting
 * - Zod validation error handling (400)
 * - RFC 7807 Problem Details for 500 errors
 */
export function apiHandler(handler: ApiHandler) {
  return async (req: NextRequest, ...args: any[]) => {
    // Basic Rate Limiting
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

    const rateLimit = checkRateLimit(ip);
    
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          type: 'https://api.obligacje.pl/errors/rate-limit-exceeded',
          title: 'Too Many Requests',
          status: 429,
          detail: 'Rate limit exceeded. Please try again in a minute.',
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimit.reset / 1000).toString(),
          }
        }
      );
    }

    try {
      return await handler(req, ...args);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            type: 'https://api.obligacje.pl/errors/validation-failed',
            title: 'Bad Request',
            status: 400,
            detail: 'The request payload is invalid.',
            errors: error.issues,
          },
          { status: 400 }
        );
      }

      console.error(`[API Error] ${req.method} ${req.nextUrl.pathname}:`, error);

      // RFC 7807 Problem Details for all other errors
      return NextResponse.json(
        {
          type: 'https://api.obligacje.pl/errors/internal-server-error',
          title: 'Internal Server Error',
          status: 500,
          detail: error instanceof Error ? error.message : 'An unexpected error occurred.',
        },
        { status: 500 }
      );
    }
  };
}
