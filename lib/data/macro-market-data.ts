import { cache } from 'react';
import { differenceInDays, format } from 'date-fns';
import { and, asc, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { db } from '@/db';
import { dataPoints, dataSeries } from '@/db/schema';
import { CalculationDataFreshness } from '@/features/bond-core/types/scenarios';
import { CPI_SLUGS, getCached, getSeriesReferenceDate, NBP_RATE_SLUGS, setCache } from './market-data-cache';
import { listRecentSyncRuns } from '@/lib/server/sync/run-history';

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

export const getGlobalDataFreshness = cache(async (): Promise<CalculationDataFreshness> => {
  const cacheKey = 'global-freshness';
  const cached = getCached<CalculationDataFreshness>(cacheKey);
  if (cached) return cached;

  const criticalSeries = await db.query.dataSeries.findMany({
    where: inArray(dataSeries.slug, [...CPI_SLUGS, ...NBP_RATE_SLUGS]),
  });

  if (criticalSeries.length === 0) {
    return { status: 'unknown', usedFallback: true };
  }

  const STALE_THRESHOLD_DAYS = 45;
  const now = new Date();
  const recentSyncRuns = await listRecentSyncRuns(20);
  const latestRecordedSync = recentSyncRuns
    .filter((run) => run.finishedAt)
    .sort((a, b) => (b.finishedAt?.getTime() ?? 0) - (a.finishedAt?.getTime() ?? 0))[0];
  const latestSeriesSyncCheck = criticalSeries
    .map((series) => series.updatedAt)
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const latestSyncCheck = latestRecordedSync?.finishedAt ?? latestSeriesSyncCheck;
  const seriesWithDates = criticalSeries
    .map((series) => ({ series, referenceDate: getSeriesReferenceDate(series) }))
    .filter(
      (
        item,
      ): item is {
        series: (typeof criticalSeries)[number];
        referenceDate: Date;
      } => item.referenceDate instanceof Date,
    );
  const usedFallback =
    seriesWithDates.length !== criticalSeries.length ||
    criticalSeries.some((series) => series.lastSyncStatus === 'failed');

  if (!seriesWithDates.length) {
    const result: CalculationDataFreshness = {
      status: 'unknown',
      asOf: latestSyncCheck ? format(latestSyncCheck, 'yyyy-MM-dd') : undefined,
      coverageAsOf: undefined,
      lastSyncedAt: latestSyncCheck?.toISOString(),
      lastCheck: latestSyncCheck?.toISOString(),
      usedFallback: true,
    };
    setCache(cacheKey, result);
    return result;
  }

  const oldestCriticalPoint = seriesWithDates
    .map((item) => item.referenceDate)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const daysOld = differenceInDays(now, oldestCriticalPoint);
  const status = usedFallback ? 'fallback' : daysOld > STALE_THRESHOLD_DAYS ? 'stale' : 'fresh';

  const result: CalculationDataFreshness = {
    status: status as CalculationDataFreshness['status'],
    asOf: oldestCriticalPoint ? format(oldestCriticalPoint, 'yyyy-MM') : undefined,
    coverageAsOf: oldestCriticalPoint ? format(oldestCriticalPoint, 'yyyy-MM') : undefined,
    lastSyncedAt: latestSyncCheck?.toISOString(),
    lastCheck: latestSyncCheck?.toISOString(),
    usedFallback,
  };
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
