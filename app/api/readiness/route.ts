import { NextResponse } from 'next/server';
import { getReadinessSnapshot } from '@/lib/server/readiness/service';

export async function GET() {
  const snapshot = await getReadinessSnapshot();

  return NextResponse.json(snapshot, { status: snapshot.ok ? 200 : 503 });
}
