import { NextResponse } from 'next/server';
import { getMultiAssetHistory } from '@/lib/data-access';

export async function GET() {
  try {
    const history = await getMultiAssetHistory();
    return NextResponse.json(history);
  } catch (error) {
    console.error('Failed to fetch multi-asset history:', error);
    return NextResponse.json(
      {
        data: [],
        source: 'fallback',
        usedFallback: true,
        coverageStart: '2020-01',
        coverageEnd: '2020-01',
      },
      { status: 500 },
    );
  }
}
