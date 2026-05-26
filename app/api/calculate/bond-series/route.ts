import { NextRequest, NextResponse } from 'next/server';
import { getAllBondSeries, getBondSeriesBySymbol } from '@/lib/data/bond-series';
import { createSuccessResponse } from '@/shared/types/api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    const allSeries = await getAllBondSeries();
    return NextResponse.json(createSuccessResponse(allSeries));
  }

  const series = await getBondSeriesBySymbol(symbol);
  return NextResponse.json(createSuccessResponse(series));
}
