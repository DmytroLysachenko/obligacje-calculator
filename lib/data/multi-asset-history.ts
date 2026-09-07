import { and, asc, gte, inArray, lte } from 'drizzle-orm';
import { cache } from 'react';

import { db } from '@/db';
import { dataPoints, dataSeries } from '@/db/schema';
import {
  HISTORICAL_RETURNS,
  type MonthlyReturn,
} from '@/features/bond-core/constants/historical-data';
import { HistoricalAverages } from '@/features/bond-core/types/scenarios';

import {
  CPI_SLUGS,
  getCached,
  GOLD_SLUGS,
  NBP_RATE_SLUGS,
  setCache,
  SP500_SLUGS,
} from './market-data-cache';
import {
  buildMultiAssetHistory,
  getMultiAssetSeriesAvailability,
  type MultiAssetHistoryEnvelope,
  type MultiAssetSeriesAvailability,
} from './multi-asset-history-projection';

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

    const source = {
      sp500: sp500Points,
      gold: goldPoints,
      inflation: inflationPoints,
      nbpRate: nbpPoints,
    };
    const seriesAvailability = getMultiAssetSeriesAvailability(source);
    const result = buildMultiAssetHistory(source);

    if (!result) {
      const fallbackResult = createFallbackMultiAssetHistory(seriesAvailability);
      setCache(cacheKey, fallbackResult);
      return fallbackResult;
    }
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
