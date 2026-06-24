import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { mapApiErrorToProblemDetails } from './problem-details';

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
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
    reset: limitData.lastReset + RATE_LIMIT_WINDOW,
  };
}

export type ApiHandler<TContext = { params: Promise<Record<string, never>> }> = (
  req: NextRequest,
  context: TContext,
) => Promise<NextResponse> | NextResponse;

/**
 * Standardized API Route Handler wrapper.
 * Implements:
 * - Basic IP-based rate limiting
 * - Zod validation error handling (400)
 * - RFC 7807 Problem Details for 500 errors
 */
export function apiHandler<TContext = { params: Promise<Record<string, never>> }>(
  handler: ApiHandler<TContext>,
) {
  return async (req: NextRequest, context: TContext) => {
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
          },
        },
      );
    }

    try {
      return await handler(req, context);
    } catch (error) {
      const problem = mapApiErrorToProblemDetails(error, {
        includeInternalMessage: process.env.NODE_ENV === 'development',
      });
      console.error(`[API Error] ${req.method} ${req.nextUrl.pathname}:`, error);

      return NextResponse.json(problem, { status: problem.status });
    }
  };
}
