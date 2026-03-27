import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dataSeries, dataPoints } from '@/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';

const FALLBACK_NBP = [
  { date: '2021-01', rate: 0.1 },
  { date: '2021-10', rate: 0.5 },
  { date: '2021-11', rate: 1.25 },
  { date: '2021-12', rate: 1.75 },
  { date: '2022-01', rate: 2.25 },
  { date: '2022-02', rate: 2.75 },
  { date: '2022-03', rate: 3.5 },
  { date: '2022-04', rate: 4.5 },
  { date: '2022-05', rate: 5.25 },
  { date: '2022-06', rate: 6.0 },
  { date: '2022-07', rate: 6.5 },
  { date: '2022-09', rate: 6.75 },
  { date: '2023-09', rate: 6.0 },
  { date: '2023-10', rate: 5.75 },
  { date: '2024-01', rate: 5.75 },
  { date: '2025-01', rate: 5.75 },
];

interface ChartSeriesEnvelope<T> {
  data: T[];
  source: 'database' | 'fallback';
  usedFallback: boolean;
  asOf?: string;
  coverageStart?: string;
  coverageEnd?: string;
}

function fallbackResponse() {
  return NextResponse.json<ChartSeriesEnvelope<(typeof FALLBACK_NBP)[number]>>({
    data: FALLBACK_NBP,
    source: 'fallback',
    usedFallback: true,
    coverageStart: FALLBACK_NBP[0]?.date,
    coverageEnd: FALLBACK_NBP[FALLBACK_NBP.length - 1]?.date,
  });
}

export async function GET() {
  try {
    const series = await db.query.dataSeries.findFirst({
      where: inArray(dataSeries.slug, ['nbp-ref-rate', 'nbp-reference-rate', 'nbp-rate']),
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

    return NextResponse.json<ChartSeriesEnvelope<(typeof formatted)[number]>>({
      data: formatted,
      source: 'database',
      usedFallback: false,
      asOf: data[0]?.date,
      coverageStart: formatted[0]?.date,
      coverageEnd: formatted[formatted.length - 1]?.date,
    });
  } catch (error) {
    console.error('Failed to fetch NBP data:', error);
    return fallbackResponse();
  }
}
