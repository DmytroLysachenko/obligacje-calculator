import { getMultiAssetHistory } from '@/lib/data/market-data';
import { HISTORICAL_RETURNS } from '@/features/bond-core/constants/historical-data';
import { okJson } from '@/lib/server/http/responses';

export async function GET() {
  try {
    const history = await getMultiAssetHistory();
    return okJson(history);
  } catch (error) {
    console.error('Failed to fetch multi-asset history:', error);
    // Even on error, we return successful envelope with fallback data
    return okJson(
      {
        data: HISTORICAL_RETURNS,
        source: 'fallback' as const,
        usedFallback: true,
        coverageStart: HISTORICAL_RETURNS[0]?.date ?? '2020-01',
        coverageEnd: HISTORICAL_RETURNS[HISTORICAL_RETURNS.length - 1]?.date ?? '2024-06',
        seriesAvailability: {
          sp500: false,
          gold: false,
          inflation: false,
          nbpRate: false,
        },
      },
      { status: 200 },
    );
  }
}

