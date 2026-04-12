import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bondSeries, polishBonds } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createSuccessResponse } from '@/shared/types/api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    const allSeries = await db.query.bondSeries.findMany();
    return NextResponse.json(createSuccessResponse(allSeries));
  }

  const bondType = await db.query.polishBonds.findFirst({
    where: eq(polishBonds.symbol, symbol),
  });

  if (!bondType) {
    return NextResponse.json(createSuccessResponse([]));
  }

  const series = await db.query.bondSeries.findMany({
    where: eq(bondSeries.bondTypeId, bondType.id),
  });

  return NextResponse.json(createSuccessResponse(series));
}
