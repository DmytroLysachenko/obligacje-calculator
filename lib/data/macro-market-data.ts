import { differenceInCalendarMonths, differenceInDays, format } from 'date-fns';
import { and, asc, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { cache } from 'react';

import { db } from '@/db';
import { dataPoints, dataSeries } from '@/db/schema';
import { CalculationDataFreshness } from '@/features/bond-core/types/scenarios';
import { listRecentSyncRuns } from '@/lib/server/sync/run-history';

import {
  CPI_SLUGS,
  getCached,
  getSeriesReferenceDate,
  NBP_RATE_SLUGS,
  setCache,
} from './market-data-cache';

export interface MacroAssumptionDefaults {
  expectedInflation: number;
  expectedNbpRate: number;
  inflationAsOf?: string;
  nbpAsOf?: string;
  usedFallback: boolean;
}

const FALLBACK_MACRO_ASSUMPTIONS: MacroAssumptionDefaults = {
  expectedInflation: 2.5,
  expectedNbpRate: 5.25,
  usedFallback: true,
};

type FreshnessSeries = Awaited<ReturnType<typeof db.query.dataSeries.findMany>>[number];
type FreshnessSyncRun = Awaited<ReturnType<typeof listRecentSyncRuns>>[number];

const CANONICAL_CPI_SLUG = 'pl-cpi';
const CANONICAL_NBP_SLUG = 'nbp-ref-rate';
const CPI_PUBLICATION_LAG_MONTHS = 2;
const NBP_CHECK_STALE_DAYS = 14;

function selectFreshnessSeries(series: FreshnessSeries[]) {
  const cpiSeries =
    series.find((item) => item.slug === CANONICAL_CPI_SLUG) ??
    series.find((item) => CPI_SLUGS.includes(item.slug));
  const nbpSeries =
    series.find((item) => item.slug === CANONICAL_NBP_SLUG) ??
    series.find((item) => NBP_RATE_SLUGS.includes(item.slug));

  return [cpiSeries, nbpSeries].filter((item): item is FreshnessSeries => Boolean(item));
}

function getLatestSyncDate(syncRuns: FreshnessSyncRun[], seriesSlug: string) {
  return syncRuns
    .filter((run) => run.seriesSlug === seriesSlug && run.finishedAt)
    .map((run) => run.finishedAt)
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => b.getTime() - a.getTime())[0];
}

function isCpiCoverageStale(referenceDate: Date, now: Date) {
  return differenceInCalendarMonths(now, referenceDate) > CPI_PUBLICATION_LAG_MONTHS;
}

function getNbpCheckDate(series: FreshnessSeries, syncRuns: FreshnessSyncRun[]) {
  return (
    getLatestSyncDate(syncRuns, series.slug) ?? series.updatedAt ?? getSeriesReferenceDate(series)
  );
}

export function resolveGlobalDataFreshness(
  allSeries: FreshnessSeries[],
  recentSyncRuns: FreshnessSyncRun[],
  now = new Date(),
): CalculationDataFreshness {
  const criticalSeries = selectFreshnessSeries(allSeries);

  if (criticalSeries.length === 0) {
    return { status: 'unknown', usedFallback: true };
  }

  const latestRecordedSync = recentSyncRuns
    .filter((run) => run.finishedAt)
    .sort((a, b) => (b.finishedAt?.getTime() ?? 0) - (a.finishedAt?.getTime() ?? 0))[0];
  const latestSeriesSyncCheck = criticalSeries
    .map((series) => series.updatedAt)
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const latestSyncCheck = latestRecordedSync?.finishedAt ?? latestSeriesSyncCheck;
  const cpiSeries = criticalSeries.find((series) => CPI_SLUGS.includes(series.slug));
  const nbpSeries = criticalSeries.find((series) => NBP_RATE_SLUGS.includes(series.slug));
  const cpiReferenceDate = cpiSeries ? getSeriesReferenceDate(cpiSeries) : undefined;
  const nbpCheckDate = nbpSeries ? getNbpCheckDate(nbpSeries, recentSyncRuns) : undefined;
  const coverageDates = [cpiReferenceDate, nbpCheckDate].filter((value): value is Date =>
    Boolean(value),
  );
  const oldestCoverageDate = coverageDates.sort((a, b) => a.getTime() - b.getTime())[0];

  const missingRequiredSeries = !cpiSeries || !nbpSeries;
  const missingRequiredDates = !cpiReferenceDate || !nbpCheckDate;
  const hasFailure = criticalSeries.some((series) => series.lastSyncStatus === 'failed');
  const cpiIsStale = cpiReferenceDate ? isCpiCoverageStale(cpiReferenceDate, now) : true;
  const nbpCheckIsStale = nbpCheckDate
    ? differenceInDays(now, nbpCheckDate) > NBP_CHECK_STALE_DAYS
    : true;
  const usesPartialReference = criticalSeries.some(
    (series) => series.lastSyncStatus === 'partial' && series.slug !== CANONICAL_NBP_SLUG,
  );
  const usedFallback =
    missingRequiredSeries || missingRequiredDates || hasFailure || usesPartialReference;

  if (!oldestCoverageDate) {
    return {
      status: 'unknown',
      asOf: latestSyncCheck ? format(latestSyncCheck, 'yyyy-MM-dd') : undefined,
      coverageAsOf: undefined,
      lastSyncedAt: latestSyncCheck?.toISOString(),
      lastCheck: latestSyncCheck?.toISOString(),
      usedFallback: true,
    };
  }

  const status: CalculationDataFreshness['status'] =
    hasFailure || cpiIsStale || nbpCheckIsStale ? 'stale' : usedFallback ? 'fallback' : 'fresh';

  return {
    status,
    asOf: format(oldestCoverageDate, 'yyyy-MM'),
    coverageAsOf: format(oldestCoverageDate, 'yyyy-MM'),
    lastSyncedAt: latestSyncCheck?.toISOString(),
    lastCheck: latestSyncCheck?.toISOString(),
    usedFallback,
  };
}

export const getGlobalDataFreshness = cache(async (): Promise<CalculationDataFreshness> => {
  const cacheKey = 'global-freshness';
  const cached = getCached<CalculationDataFreshness>(cacheKey);
  if (cached) return cached;

  const allMacroSeries = await db.query.dataSeries.findMany({
    where: inArray(dataSeries.slug, [...CPI_SLUGS, ...NBP_RATE_SLUGS]),
  });

  if (allMacroSeries.length === 0) {
    return { status: 'unknown', usedFallback: true };
  }

  const recentSyncRuns = await listRecentSyncRuns(20);
  const result = resolveGlobalDataFreshness(allMacroSeries, recentSyncRuns);
  setCache(cacheKey, result);
  return result;
});

export const getHistoricalDataMap = cache(async (fromDate: string, toDate: string) => {
  const cacheKey = `historical-map-${fromDate}-${toDate}`;
  const cached = getCached<Record<string, { inflation?: number; nbpRate?: number }>>(cacheKey);
  if (cached) return cached;

  const series = await db.query.dataSeries.findMany({
    where: inArray(dataSeries.slug, [...CPI_SLUGS, ...NBP_RATE_SLUGS]),
  });

  const cpiSeries = series.find((s) => CPI_SLUGS.includes(s.slug));
  const nbpSeries = series.find((s) => NBP_RATE_SLUGS.includes(s.slug));

  if (!cpiSeries && !nbpSeries) return {};

  const seriesIds = series.map((s) => s.id);

  const points = await db.query.dataPoints.findMany({
    where: and(
      inArray(dataPoints.seriesId, seriesIds),
      gte(dataPoints.date, fromDate),
      lte(dataPoints.date, toDate),
    ),
    orderBy: [asc(dataPoints.date)],
  });

  const map: Record<string, { inflation?: number; nbpRate?: number }> = {};

  points.forEach((item) => {
    const key = item.date.substring(0, 7);
    if (!map[key]) map[key] = {};

    const value = parseFloat(item.value);
    if (item.seriesId === cpiSeries?.id) map[key].inflation = value;
    if (item.seriesId === nbpSeries?.id) map[key].nbpRate = value;
  });

  setCache(cacheKey, map);
  return map;
});

async function getLatestSeriesValue(seriesId?: string) {
  if (!seriesId) {
    return null;
  }

  const point = await db.query.dataPoints.findFirst({
    where: eq(dataPoints.seriesId, seriesId),
    orderBy: [desc(dataPoints.date)],
  });

  if (!point) {
    return null;
  }

  return {
    date: point.date.substring(0, 7),
    value: parseFloat(point.value),
  };
}

export const getMacroAssumptionDefaults = cache(async (): Promise<MacroAssumptionDefaults> => {
  const cacheKey = 'macro-assumption-defaults';
  const cached = getCached<MacroAssumptionDefaults>(cacheKey);
  if (cached) return cached;

  const series = await db.query.dataSeries.findMany({
    where: inArray(dataSeries.slug, [...CPI_SLUGS, ...NBP_RATE_SLUGS]),
  });

  const cpiSeries = series.find((item) => CPI_SLUGS.includes(item.slug));
  const nbpSeries = series.find((item) => NBP_RATE_SLUGS.includes(item.slug));
  const [latestInflation, latestNbpRate] = await Promise.all([
    getLatestSeriesValue(cpiSeries?.id),
    getLatestSeriesValue(nbpSeries?.id),
  ]);

  const result: MacroAssumptionDefaults = {
    expectedInflation: latestInflation?.value ?? FALLBACK_MACRO_ASSUMPTIONS.expectedInflation,
    expectedNbpRate: latestNbpRate?.value ?? FALLBACK_MACRO_ASSUMPTIONS.expectedNbpRate,
    inflationAsOf: latestInflation?.date,
    nbpAsOf: latestNbpRate?.date,
    usedFallback: !latestInflation || !latestNbpRate,
  };

  setCache(cacheKey, result);
  return result;
});
