import { NextResponse } from 'next/server';
import { getMultiAssetHistory } from '@/lib/data-access';
import { HISTORICAL_RETURNS } from '@/features/bond-core/constants/historical-data';

export async function GET() {
  try {
    const history = await getMultiAssetHistory();
    return NextResponse.json(history);
  } catch (error) {
    console.error('Failed to fetch multi-asset history:', error);
    return NextResponse.json(
      {
        data: HISTORICAL_RETURNS,
        source: 'fallback',
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
