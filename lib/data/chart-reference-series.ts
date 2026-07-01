import { addMonths, differenceInDays, format, isBefore, parseISO } from 'date-fns';

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

interface ReferenceSeriesMetadata {
  asOf?: string;
  lastCheck?: string;
  dataSource?: string;
  seriesName?: string;
  sourceUrl?: string;
}

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

export function expandMonthlyStepSeries(points: ChartRatePoint[]) {
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

export function createInflationSeriesEnvelope({
  data,
  latestPointDate,
  lastSyncStatus,
  metadata,
  now = new Date(),
}: {
  data: ChartRatePoint[];
  latestPointDate: string | null;
  lastSyncStatus: string | null;
  metadata: ReferenceSeriesMetadata;
  now?: Date;
}): ChartSeriesEnvelope<ChartRatePoint> {
  const isStaleCoverage =
    !!latestPointDate &&
    differenceInDays(now, parseISO(latestPointDate)) > CPI_STALE_THRESHOLD_DAYS;
  const hasSyncFailure = lastSyncStatus === 'failed';
  const syncStatus = hasSyncFailure
    ? 'failed'
    : lastSyncStatus === 'partial'
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
    data,
    source: 'database',
    usedFallback: isStaleCoverage || hasSyncFailure || lastSyncStatus === 'partial',
    ...metadata,
    coverageStart: data[0]?.date,
    coverageEnd: data[data.length - 1]?.date,
    syncStatus,
    coverageNote,
  };
}

export function createNbpSeriesEnvelope({
  data,
  lastSyncStatus,
  metadata,
}: {
  data: ChartRatePoint[];
  lastSyncStatus: string | null;
  metadata: ReferenceSeriesMetadata;
}): ChartSeriesEnvelope<ChartRatePoint> {
  const sparseCoverage = data.length < 8;
  const mergedFallbackCoverage = sparseCoverage
    ? Array.from(
        new Map([...FALLBACK_NBP, ...data].map((point) => [point.date, point])).values(),
      ).sort((left, right) => left.date.localeCompare(right.date))
    : data;
  const expandedCoverage = expandMonthlyStepSeries(mergedFallbackCoverage);

  const sourceIsFallbackOnly = lastSyncStatus === 'failed';
  const sourceUsesPartialCoverage = sparseCoverage || lastSyncStatus === 'partial';

  return {
    data: expandedCoverage,
    source: 'database',
    usedFallback: sourceIsFallbackOnly || sourceUsesPartialCoverage,
    ...metadata,
    coverageStart: expandedCoverage[0]?.date,
    coverageEnd: expandedCoverage[expandedCoverage.length - 1]?.date,
    syncStatus: sourceIsFallbackOnly ? 'failed' : sourceUsesPartialCoverage ? 'partial' : 'success',
    coverageNote: sourceIsFallbackOnly
      ? 'nbp-fallback-reference'
      : sourceUsesPartialCoverage
        ? 'nbp-partial-reference'
        : 'nbp-synced-context',
  };
}
