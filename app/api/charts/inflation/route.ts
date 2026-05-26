import { NextResponse } from 'next/server';
import { getFallbackInflationSeries, getInflationChartSeries } from '@/lib/data/chart-series';
import { createSuccessResponse } from '@/shared/types/api';

export async function GET() {
  try {
    const response = await getInflationChartSeries();
    return NextResponse.json(createSuccessResponse(response));
  } catch (error) {
    console.error('Failed to fetch inflation data:', error);
    return NextResponse.json(createSuccessResponse(getFallbackInflationSeries()));
  }
}
