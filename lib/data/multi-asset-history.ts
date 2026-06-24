import { cache } from 'react';
import { and, asc, gte, inArray, lte } from 'drizzle-orm';
import { db } from '@/db';
import { dataPoints, dataSeries } from '@/db/schema';
import { HistoricalAverages } from '@/features/bond-core/types/scenarios';
import {
  HISTORICAL_RETURNS,
  type MonthlyReturn,
} from '@/features/bond-core/constants/historical-data';
import {
  CPI_SLUGS,
  getCached,
  GOLD_SLUGS,
  NBP_RATE_SLUGS,
  setCache,
  SP500_SLUGS,
} from './market-data-cache';

interface MultiAssetSeriesAvailability {
  sp500: boolean;
  gold: boolean;
  inflation: boolean;
  nbpRate: boolean;
}

interface MultiAssetHistoryEnvelope {
  data: MonthlyReturn[];
  source: 'database' | 'fallback';
  usedFallback: boolean;
  coverageStart: string;
  coverageEnd: string;
  lastSyncedAt?: string;
  seriesAvailability?: MultiAssetSeriesAvailability;
}

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

const EMPTY_MULTI_ASSET_AVAILABILITY: MultiAssetSeriesAvailability = {
  sp500: false,
  gold: false,
  inflation: false,
  nbpRate: false,
};

function getFallbackCoverageBounds() {
  return {
    coverageStart: HISTORICAL_RETURNS[0]?.date ?? '2020-01',
    coverageEnd: HISTORICAL_RETURNS[HISTORICAL_RETURNS.length - 1]?.date ?? '2024-06',
  };
}

export function createFallbackMultiAssetHistory(
  seriesAvailability: MultiAssetSeriesAvailability = EMPTY_MULTI_ASSET_AVAILABILITY,
): MultiAssetHistoryEnvelope {
  return {
    data: HISTORICAL_RETURNS,
    source: 'fallback',
    usedFallback: true,
    ...getFallbackCoverageBounds(),
    seriesAvailability,
  };
}

export const getMultiAssetHistory = cache(async (): Promise<MultiAssetHistoryEnvelope> => {
  const cacheKey = 'multi-asset-history';
  const cached = getCached<MultiAssetHistoryEnvelope>(cacheKey);
  if (cached) return cached;

  const fromDate = '1990-01-01';
  const toDate = new Date().toISOString().slice(0, 10);

  try {
    const allAliases = [...SP500_SLUGS, ...GOLD_SLUGS, ...CPI_SLUGS, ...NBP_RATE_SLUGS];
    const series = await db.query.dataSeries.findMany({
      where: inArray(dataSeries.slug, allAliases),
    });

    if (series.length === 0) {
      throw new Error('No data series found');
    }

    const seriesIds = series.map((s) => s.id);
    const sp500Id = series.find((s) => SP500_SLUGS.includes(s.slug))?.id;
    const goldId = series.find((s) => GOLD_SLUGS.includes(s.slug))?.id;
    const cpiId = series.find((s) => CPI_SLUGS.includes(s.slug))?.id;
    const nbpId = series.find((s) => NBP_RATE_SLUGS.includes(s.slug))?.id;

    const allPoints = await db.query.dataPoints.findMany({
      where: and(
        inArray(dataPoints.seriesId, seriesIds),
        gte(dataPoints.date, fromDate),
        lte(dataPoints.date, toDate),
      ),
      orderBy: [asc(dataPoints.date)],
    });

    const pointsBySeries: Record<string, { date: string; value: number }[]> = {};
    allPoints.forEach((point) => {
      if (!pointsBySeries[point.seriesId]) pointsBySeries[point.seriesId] = [];
      pointsBySeries[point.seriesId].push({
        date: point.date.substring(0, 7),
        value: parseFloat(point.value),
      });
    });

    const sp500Points = sp500Id ? pointsBySeries[sp500Id] || [] : [];
    const goldPoints = goldId ? pointsBySeries[goldId] || [] : [];
    const inflationPoints = cpiId ? pointsBySeries[cpiId] || [] : [];
    const nbpPoints = nbpId ? pointsBySeries[nbpId] || [] : [];

    const seriesAvailability = {
      sp500: sp500Points.length >= 2,
      gold: goldPoints.length >= 2,
      inflation: inflationPoints.length > 0,
      nbpRate: nbpPoints.length > 0,
    };

    if (sp500Points.length < 2 || goldPoints.length < 2 || inflationPoints.length === 0) {
      const fallbackResult = createFallbackMultiAssetHistory(seriesAvailability);
      setCache(cacheKey, fallbackResult);
      return fallbackResult;
    }

    const sp500Returns = buildMonthlyPercentChangeMap(sp500Points);
    const goldReturns = buildMonthlyPercentChangeMap(goldPoints);
    const inflationMap = new Map(inflationPoints.map((point) => [point.date, point.value]));
    const nbpMap = new Map(nbpPoints.map((point) => [point.date, point.value]));

    const dates = Array.from(
      new Set([
        ...sp500Returns.keys(),
        ...goldReturns.keys(),
        ...inflationMap.keys(),
        ...nbpMap.keys(),
      ]),
    ).sort();

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
      const fallbackResult = createFallbackMultiAssetHistory(seriesAvailability);
      setCache(cacheKey, fallbackResult);
      return fallbackResult;
    }

    const lastSyncedAt = [sp500Points, goldPoints, inflationPoints, nbpPoints]
      .flat()
      .map((point) => point.date)
      .sort()
      .at(-1);

    const result: MultiAssetHistoryEnvelope = {
      data,
      source: 'database',
      usedFallback: nbpPoints.length === 0,
      coverageStart: data[0].date,
      coverageEnd: data[data.length - 1].date,
      lastSyncedAt,
      seriesAvailability,
    };
    setCache(cacheKey, result);
    return result;
  } catch {
    return createFallbackMultiAssetHistory();
  }
});

export const getHistoricalAverages = cache(async (): Promise<HistoricalAverages> => {
  const cacheKey = 'historical-averages';
  const cached = getCached<HistoricalAverages>(cacheKey);
  if (cached) return cached;

  const { data } = await getMultiAssetHistory();

  const calculateAverage = (
    items: MonthlyReturn[],
    key: 'inflation' | 'nbpRate',
    months: number,
  ) => {
    const recent = items.slice(-months);
    if (recent.length === 0) return 0;
    const sum = recent.reduce((acc, curr) => acc + (curr[key] || 0), 0);
    return sum / recent.length;
  };

  const result: HistoricalAverages = {
    inflation: {
      '1y': calculateAverage(data, 'inflation', 12),
      '5y': calculateAverage(data, 'inflation', 60),
      '10y': calculateAverage(data, 'inflation', 120),
    },
    nbpRate: {
      '1y': calculateAverage(data, 'nbpRate', 12),
      '5y': calculateAverage(data, 'nbpRate', 60),
      '10y': calculateAverage(data, 'nbpRate', 120),
    },
  };

  setCache(cacheKey, result);
  return result;
});
