import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createServerLogger } from '@/lib/server/logging';

const logger = createServerLogger('WebVitals');
const MAX_METRIC_PAYLOAD_BYTES = 2_048;

const payloadSchema = z.object({
  name: z.enum(['CLS', 'INP', 'LCP']),
  value: z.number().finite().nonnegative().max(60_000),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
  path: z
    .string()
    .regex(/^\/[a-z0-9/_-]*$/i)
    .max(160),
  navigationType: z.enum(['navigate', 'reload', 'back_forward', 'prerender']).default('navigate'),
});

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (!Number.isFinite(contentLength) || contentLength > MAX_METRIC_PAYLOAD_BYTES) {
    return NextResponse.json({ error: 'Invalid metric payload' }, { status: 400 });
  }

  const payload = payloadSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ error: 'Invalid metric payload' }, { status: 400 });
  }

  logger.info('web_vital', {
    event: 'web_vital',
    metric: payload.data.name,
    value: payload.data.value,
    rating: payload.data.rating,
    path: payload.data.path,
    navigation_type: payload.data.navigationType,
  });

  return new NextResponse(null, { status: 204 });
}
