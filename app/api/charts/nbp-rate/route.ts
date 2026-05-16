import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dataSeries, dataPoints } from '@/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';
import { createSuccessResponse } from '@/shared/types/api';
import { NBP_REFERENCE_FALLBACK_SERIES } from '@/shared/lib/nbp-reference-fallback';

const FALLBACK_NBP = NBP_REFERENCE_FALLBACK_SERIES.map((point) => ({
  date: point.date.substring(0, 7),
  rate: point.rate,
}));

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
  syncStatus?: 'success' | 'partial' | 'failed' | 'stale';
  coverageNote?: string;
  sourceUrl?: string;
}

function fallbackResponse() {
  return NextResponse.json(createSuccessResponse<ChartSeriesEnvelope<(typeof FALLBACK_NBP)[number]>>({
    data: FALLBACK_NBP,
    source: 'fallback',
    usedFallback: true,
    dataSource: 'Curated NBP reference-rate history from official policy publications',
    seriesName: 'NBP reference-rate history',
    coverageStart: FALLBACK_NBP[0]?.date,
    coverageEnd: FALLBACK_NBP[FALLBACK_NBP.length - 1]?.date,
    syncStatus: 'failed',
    coverageNote: 'nbp-fallback-reference',
  }));
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

    const sparseCoverage = formatted.length < 8;
    const mergedFallbackCoverage = sparseCoverage
      ? Array.from(
          new Map(
            [...FALLBACK_NBP, ...formatted].map((point) => [point.date, point]),
          ).values(),
        ).sort((left, right) => left.date.localeCompare(right.date))
      : formatted;

    const sourceIsFallbackOnly = series.lastSyncStatus === 'failed';
    const sourceUsesPartialCoverage = sparseCoverage || series.lastSyncStatus === 'partial';

    return NextResponse.json(createSuccessResponse<ChartSeriesEnvelope<(typeof formatted)[number]>>({
      data: mergedFallbackCoverage,
      source: 'database',
      usedFallback: sourceIsFallbackOnly || sourceUsesPartialCoverage,
      asOf: data[0]?.date,
      lastCheck: series.updatedAt?.toISOString(),
      dataSource: series.dataSource ?? 'database',
      seriesName: series.name,
      coverageStart: mergedFallbackCoverage[0]?.date,
      coverageEnd: mergedFallbackCoverage[mergedFallbackCoverage.length - 1]?.date,
      syncStatus:
        sourceIsFallbackOnly
          ? 'failed'
          : sourceUsesPartialCoverage
            ? 'partial'
            : 'success',
      coverageNote:
        sourceIsFallbackOnly
          ? 'nbp-fallback-reference'
          : sourceUsesPartialCoverage
            ? 'nbp-partial-reference'
            : 'nbp-synced-context',
      sourceUrl: 'https://nbp.pl/',
    }));
  } catch (error) {
    console.error('Failed to fetch NBP data:', error);
    return fallbackResponse();
  }
}
