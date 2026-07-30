import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { createServerLogger } from '@/lib/server/logging';

import { mapApiErrorToProblemDetails } from './problem-details';
import { BoundedMemoryRateLimiter, defaultApiRateLimitPolicy } from './rate-limiter';

const logger = createServerLogger('ApiHandler');
const rateLimiter = new BoundedMemoryRateLimiter();

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

    const rateLimit = rateLimiter.consume(ip, defaultApiRateLimitPolicy);

    if (!rateLimit.allowed) {
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
            'RateLimit-Limit': rateLimit.limit.toString(),
            'RateLimit-Remaining': rateLimit.remaining.toString(),
            'RateLimit-Reset': Math.ceil(rateLimit.resetAt / 1000).toString(),
            'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
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
      logger.error(`${req.method} ${req.nextUrl.pathname}`, error);

      return NextResponse.json(problem, { status: problem.status });
    }
  };
}
