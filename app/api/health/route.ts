import { NextResponse } from 'next/server';
import { MODEL_VERSION } from '@/features/bond-core/model-version';

export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'obligacje-calculator',
    modelVersion: MODEL_VERSION,
    timestamp: new Date().toISOString(),
  });
}
