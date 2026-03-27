import { db } from "@/db";
import { dataSeries, dataPoints } from "@/db/schema";
import { eq, and, gte, lte, asc, inArray } from "drizzle-orm";
import { cache } from "react";
import { HISTORICAL_RETURNS, type MonthlyReturn } from "@/features/bond-core/constants/historical-data";

const CPI_SLUGS = ['pl-cpi', 'inflation-pl'];
const NBP_RATE_SLUGS = ['nbp-ref-rate', 'nbp-reference-rate', 'nbp-rate'];
const SP500_SLUGS = ['sp500'];
const GOLD_SLUGS = ['gold-usd', 'gold'];

interface MultiAssetHistoryEnvelope {
  data: MonthlyReturn[];
  source: 'database' | 'fallback';
  usedFallback: boolean;
  coverageStart: string;
  coverageEnd: string;
  lastSyncedAt?: string;
}

/**
 * Fetches historical data for multiple indicators and returns them as a map keyed by YYYY-MM.
 */
export const getHistoricalDataMap = cache(async (fromDate: string, toDate: string) => {
  // Find the IDs for the relevant series
  const series = await db.query.dataSeries.findMany({
    where: inArray(dataSeries.slug, [...CPI_SLUGS, ...NBP_RATE_SLUGS]),
  });

  const cpiSeries = series.find(s => CPI_SLUGS.includes(s.slug));
  const nbpSeries = series.find(s => NBP_RATE_SLUGS.includes(s.slug));

  if (!cpiSeries && !nbpSeries) return {};

  const seriesIds = series.map(s => s.id);

  const points = await db.query.dataPoints.findMany({
    where: and(
      inArray(dataPoints.seriesId, seriesIds),
      gte(dataPoints.date, fromDate),
      lte(dataPoints.date, toDate)
    ),
    orderBy: [asc(dataPoints.date)],
  });

  const map: Record<string, { inflation?: number; nbpRate?: number }> = {};
  
  points.forEach(item => {
    const key = item.date.substring(0, 7); // YYYY-MM
    if (!map[key]) map[key] = {};
    
    const val = parseFloat(item.value);
    if (item.seriesId === cpiSeries?.id) map[key].inflation = val;
    if (item.seriesId === nbpSeries?.id) map[key].nbpRate = val;
  });

  return map;
});

/**
 * LEGACY - Keep for compatibility if needed elsewhere, but updated to use new schema
 */
export const getIndicatorHistory = cache(async (slug: string, fromDate: string, toDate: string) => {
  const series = await db.query.dataSeries.findFirst({
    where: eq(dataSeries.slug, slug),
  });

  if (!series) return [];

  return await db.query.dataPoints.findMany({
    where: and(
      eq(dataPoints.seriesId, series.id),
      gte(dataPoints.date, fromDate),
      lte(dataPoints.date, toDate)
    ),
    orderBy: [asc(dataPoints.date)],
  });
});

const getSeriesPointsByAliases = async (aliases: string[], fromDate: string, toDate: string) => {
  const series = await db.query.dataSeries.findMany({
    where: inArray(dataSeries.slug, aliases),
  });
  const selectedSeries = series[0];

  if (!selectedSeries) {
    return [];
  }

  const points = await db.query.dataPoints.findMany({
    where: and(
      eq(dataPoints.seriesId, selectedSeries.id),
      gte(dataPoints.date, fromDate),
      lte(dataPoints.date, toDate),
    ),
    orderBy: [asc(dataPoints.date)],
  });

  return points.map((point) => ({
    date: point.date.substring(0, 7),
    value: parseFloat(point.value),
  }));
};

const buildMonthlyPercentChangeMap = (series: { date: string; value: number }[]) => {
  const result = new Map<string, number>();

  for (let i = 0; i < series.length; i += 1) {
    const current = series[i];
    const previous = series[i - 1];

    if (!previous || previous.value === 0) {
      result.set(current.date, 0);
      continue;
    }

    result.set(current.date, ((current.value - previous.value) / previous.value) * 100);
  }

  return result;
};

export const getMultiAssetHistory = cache(async (): Promise<MultiAssetHistoryEnvelope> => {
  const fallbackCoverageStart = HISTORICAL_RETURNS[0]?.date ?? '2020-01';
  const fallbackCoverageEnd = HISTORICAL_RETURNS[HISTORICAL_RETURNS.length - 1]?.date ?? '2024-06';
  const fromDate = '1990-01-01';
  const toDate = new Date().toISOString().slice(0, 10);

  try {
    const [sp500Points, goldPoints, inflationPoints, nbpPoints] = await Promise.all([
      getSeriesPointsByAliases(SP500_SLUGS, fromDate, toDate),
      getSeriesPointsByAliases(GOLD_SLUGS, fromDate, toDate),
      getSeriesPointsByAliases(CPI_SLUGS, fromDate, toDate),
      getSeriesPointsByAliases(NBP_RATE_SLUGS, fromDate, toDate),
    ]);

    if (sp500Points.length < 2 || goldPoints.length < 2 || inflationPoints.length === 0) {
      return {
        data: HISTORICAL_RETURNS,
        source: 'fallback',
        usedFallback: true,
        coverageStart: fallbackCoverageStart,
        coverageEnd: fallbackCoverageEnd,
      };
    }

    const sp500Returns = buildMonthlyPercentChangeMap(sp500Points);
    const goldReturns = buildMonthlyPercentChangeMap(goldPoints);
    const inflationMap = new Map(inflationPoints.map((point) => [point.date, point.value]));
    const nbpMap = new Map(nbpPoints.map((point) => [point.date, point.value]));

    const dates = Array.from(new Set([
      ...sp500Returns.keys(),
      ...goldReturns.keys(),
      ...inflationMap.keys(),
      ...nbpMap.keys(),
    ])).sort();

    const data = dates
      .filter((date) => inflationMap.has(date))
      .map((date) => {
        const nbpRate = nbpMap.get(date) ?? 0;
        const annualSavingsRate = Math.max(0, nbpRate + 1);
        const monthlySavingsRate = (Math.pow(1 + annualSavingsRate / 100, 1 / 12) - 1) * 100 * 0.81;

        return {
          date,
          sp500: sp500Returns.get(date) ?? 0,
          gold: goldReturns.get(date) ?? 0,
          savings: monthlySavingsRate,
          inflation: inflationMap.get(date) ?? 0,
          nbpRate,
        };
      });

    if (data.length === 0) {
      return {
        data: HISTORICAL_RETURNS,
        source: 'fallback',
        usedFallback: true,
        coverageStart: fallbackCoverageStart,
        coverageEnd: fallbackCoverageEnd,
      };
    }

    const lastSyncedAt = [sp500Points, goldPoints, inflationPoints, nbpPoints]
      .flat()
      .map((point) => point.date)
      .sort()
      .at(-1);

    return {
      data,
      source: 'database',
      usedFallback: nbpPoints.length === 0,
      coverageStart: data[0].date,
      coverageEnd: data[data.length - 1].date,
      lastSyncedAt,
    };
  } catch {
    return {
      data: HISTORICAL_RETURNS,
      source: 'fallback',
      usedFallback: true,
      coverageStart: fallbackCoverageStart,
      coverageEnd: fallbackCoverageEnd,
    };
  }
});
