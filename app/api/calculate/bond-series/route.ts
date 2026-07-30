import { NextRequest } from 'next/server';

import { getAllBondSeries, getBondSeriesBySymbol } from '@/lib/data/bond-series';
import { apiHandler } from '@/lib/server/http/api-handler';
import { defaultApiRateLimitPolicy } from '@/lib/server/http/rate-limiter';
import { okJson } from '@/lib/server/http/responses';

export const GET = apiHandler(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      const allSeries = await getAllBondSeries();
      return okJson(allSeries);
    }

    const series = await getBondSeriesBySymbol(symbol);
    return okJson(series);
  },
  { rateLimitPolicy: defaultApiRateLimitPolicy },
);
