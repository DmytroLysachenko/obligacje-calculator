import { NextResponse } from 'next/server';
import { getFallbackNbpSeries, getNbpChartSeries } from '@/lib/data/chart-series';
import { createSuccessResponse } from '@/shared/types/api';

export async function GET() {
  try {
    const response = await getNbpChartSeries();
    return NextResponse.json(createSuccessResponse(response));
  } catch (error) {
    console.error('Failed to fetch NBP data:', error);
    return NextResponse.json(createSuccessResponse(getFallbackNbpSeries()));
  }
}
