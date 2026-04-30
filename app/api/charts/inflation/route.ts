import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dataSeries, dataPoints } from '@/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';
import { createSuccessResponse } from '@/shared/types/api';

const FALLBACK_INFLATION = [
  { date: '2015-01', rate: -0.9 },
  { date: '2016-01', rate: -0.6 },
  { date: '2017-01', rate: 2.0 },
  { date: '2018-01', rate: 1.6 },
  { date: '2019-01', rate: 2.3 },
  { date: '2020-01', rate: 3.4 },
  { date: '2021-01', rate: 5.1 },
  { date: '2022-01', rate: 14.4 },
  { date: '2023-01', rate: 11.4 },
  { date: '2024-01', rate: 3.7 },
  { date: '2025-01', rate: 4.2 },
];

interface ChartSeriesEnvelope<T> {
  data: T[];
  source: 'database' | 'fallback';
  usedFallback: boolean;
  asOf?: string;
  lastCheck?: string;
  coverageStart?: string;
  coverageEnd?: string;
  dataSource?: string;
  seriesName?: string;
}

function fallbackResponse() {
  return NextResponse.json(createSuccessResponse<ChartSeriesEnvelope<(typeof FALLBACK_INFLATION)[number]>>({
    data: FALLBACK_INFLATION,
    source: 'fallback',
    usedFallback: true,
    dataSource: 'static fallback dataset',
    seriesName: 'Inflation fallback',
    coverageStart: FALLBACK_INFLATION[0]?.date,
    coverageEnd: FALLBACK_INFLATION[FALLBACK_INFLATION.length - 1]?.date,
  }));
}

export async function GET() {
  try {
    const series = await db.query.dataSeries.findFirst({
      where: inArray(dataSeries.slug, ['pl-cpi', 'inflation-pl']),
    });

    if (!series) {
      return fallbackResponse();
    }

    const data = await db.query.dataPoints.findMany({
      where: eq(dataPoints.seriesId, series.id),
      orderBy: [desc(dataPoints.date)],
      limit: 500,
    });

    if (!data.length) {
      return fallbackResponse();
    }

    const formatted = data
      .map((point) => ({
        date: point.date.substring(0, 7),
        rate: parseFloat(point.value),
      }))
      .reverse();

    return NextResponse.json(createSuccessResponse<ChartSeriesEnvelope<(typeof formatted)[number]>>({
      data: formatted,
      source: 'database',
      usedFallback: false,
      asOf: data[0]?.date,
      lastCheck: series.updatedAt?.toISOString(),
      dataSource: series.dataSource ?? 'database',
      seriesName: series.name,
      coverageStart: formatted[0]?.date,
      coverageEnd: formatted[formatted.length - 1]?.date,
    }));
  } catch (error) {
    console.error('Failed to fetch inflation data:', error);
    return fallbackResponse();
  }
}
