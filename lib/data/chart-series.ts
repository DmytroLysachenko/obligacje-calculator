import { addMonths, differenceInDays, format, isBefore, parseISO } from 'date-fns';
import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { dataPoints, dataSeries } from '@/db/schema';
import { GusCpiApiClient } from '@/lib/api-clients/gus-cpi';
import { NBP_REFERENCE_FALLBACK_SERIES } from '@/shared/lib/nbp-reference-fallback';

export interface ChartSeriesEnvelope<T> {
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

export type ChartRatePoint = {
  date: string;
  rate: number;
};

const FALLBACK_INFLATION: ChartRatePoint[] = [
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

const FALLBACK_NBP: ChartRatePoint[] = NBP_REFERENCE_FALLBACK_SERIES.map((point) => ({
  date: point.date.substring(0, 7),
  rate: point.rate,
}));

const CPI_STALE_THRESHOLD_DAYS = 62;

function expandMonthlyStepSeries(points: ChartRatePoint[]) {
  if (points.length <= 1) {
    return points;
  }

  const expanded: ChartRatePoint[] = [];

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    expanded.push(current);

    if (!next) {
      continue;
    }

    let cursor = addMonths(parseISO(`${current.date}-01`), 1);
    const nextDate = parseISO(`${next.date}-01`);

    while (isBefore(cursor, nextDate)) {
      expanded.push({
        date: format(cursor, 'yyyy-MM'),
        rate: current.rate,
      });
      cursor = addMonths(cursor, 1);
    }
  }

  return expanded;
}

export function getFallbackInflationSeries(): ChartSeriesEnvelope<ChartRatePoint> {
  return {
    data: FALLBACK_INFLATION,
    source: 'fallback',
    usedFallback: true,
    dataSource: 'static fallback dataset',
    seriesName: 'Inflation fallback',
    coverageStart: FALLBACK_INFLATION[0]?.date,
    coverageEnd: FALLBACK_INFLATION[FALLBACK_INFLATION.length - 1]?.date,
    syncStatus: 'failed',
    coverageNote: 'cpi-fallback-reference',
  };
}

export function getFallbackNbpSeries(): ChartSeriesEnvelope<ChartRatePoint> {
  const expandedFallbackCoverage = expandMonthlyStepSeries(FALLBACK_NBP);
  return {
    data: expandedFallbackCoverage,
    source: 'fallback',
    usedFallback: true,
    dataSource: 'Curated NBP reference-rate history from official policy publications',
    seriesName: 'NBP reference-rate history',
    coverageStart: expandedFallbackCoverage[0]?.date,
    coverageEnd: expandedFallbackCoverage[expandedFallbackCoverage.length - 1]?.date,
    syncStatus: 'failed',
    coverageNote: 'nbp-fallback-reference',
  };
}

export async function getInflationChartSeries(): Promise<ChartSeriesEnvelope<ChartRatePoint>> {
  const series = await db.query.dataSeries.findFirst({
    where: inArray(dataSeries.slug, ['pl-cpi', 'inflation-pl']),
  });

  if (!series) {
    return getFallbackInflationSeries();
  }

  const data = await db.query.dataPoints.findMany({
    where: eq(dataPoints.seriesId, series.id),
    orderBy: [desc(dataPoints.date)],
    limit: 500,
  });

  if (!data.length) {
    return getFallbackInflationSeries();
  }

  const formatted = data
    .map((point) => ({
      date: point.date.substring(0, 7),
      rate: parseFloat(point.value),
    }))
    .reverse();

  const latestPointDate = data[0]?.date ? parseISO(data[0].date) : null;
  const isStaleCoverage =
    !!latestPointDate &&
    differenceInDays(new Date(), latestPointDate) > CPI_STALE_THRESHOLD_DAYS;
  const hasSyncFailure = series.lastSyncStatus === 'failed';
  const syncStatus =
    hasSyncFailure
      ? 'failed'
      : series.lastSyncStatus === 'partial'
        ? 'partial'
        : isStaleCoverage
          ? 'stale'
          : 'success';
  const coverageNote =
    syncStatus === 'success'
      ? 'reference-synced-context'
      : syncStatus === 'stale'
        ? 'cpi-stale-coverage'
        : 'cpi-fallback-reference';

  return {
    data: formatted,
    source: 'database',
    usedFallback: isStaleCoverage || hasSyncFailure || series.lastSyncStatus === 'partial',
    asOf: data[0]?.date,
    lastCheck: series.updatedAt?.toISOString(),
    dataSource: series.dataSource ?? 'database',
    seriesName: series.name,
    coverageStart: formatted[0]?.date,
    coverageEnd: formatted[formatted.length - 1]?.date,
    syncStatus,
    coverageNote,
    sourceUrl: GusCpiApiClient.archivePageUrl,
  };
}

export async function getNbpChartSeries(): Promise<ChartSeriesEnvelope<ChartRatePoint>> {
  const series = await db.query.dataSeries.findFirst({
    where: inArray(dataSeries.slug, ['nbp-ref-rate', 'nbp-reference-rate', 'nbp-rate']),
  });

  if (!series) {
    return getFallbackNbpSeries();
  }

  const data = await db.query.dataPoints.findMany({
    where: eq(dataPoints.seriesId, series.id),
    orderBy: [desc(dataPoints.date)],
    limit: 500,
  });

  if (!data.length) {
    return getFallbackNbpSeries();
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
  const expandedCoverage = expandMonthlyStepSeries(mergedFallbackCoverage);

  const sourceIsFallbackOnly = series.lastSyncStatus === 'failed';
  const sourceUsesPartialCoverage = sparseCoverage || series.lastSyncStatus === 'partial';

  return {
    data: expandedCoverage,
    source: 'database',
    usedFallback: sourceIsFallbackOnly || sourceUsesPartialCoverage,
    asOf: data[0]?.date,
    lastCheck: series.updatedAt?.toISOString(),
    dataSource: series.dataSource ?? 'database',
    seriesName: series.name,
    coverageStart: expandedCoverage[0]?.date,
    coverageEnd: expandedCoverage[expandedCoverage.length - 1]?.date,
    syncStatus: sourceIsFallbackOnly
      ? 'failed'
      : sourceUsesPartialCoverage
        ? 'partial'
        : 'success',
    coverageNote: sourceIsFallbackOnly
      ? 'nbp-fallback-reference'
      : sourceUsesPartialCoverage
        ? 'nbp-partial-reference'
        : 'nbp-synced-context',
    sourceUrl: 'https://nbp.pl/',
  };
}
