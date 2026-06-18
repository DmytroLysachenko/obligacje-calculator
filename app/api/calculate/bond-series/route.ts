import { NextRequest } from 'next/server';
import { getAllBondSeries, getBondSeriesBySymbol } from '@/lib/data/bond-series';
import { okJson } from '@/lib/server/http/responses';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    const allSeries = await getAllBondSeries();
    return okJson(allSeries);
  }

  const series = await getBondSeriesBySymbol(symbol);
  return okJson(series);
}
