import { db } from "@/db";
import { dataSeries, dataPoints, taxRules } from "@/db/schema";
import { eq, and, gte, lte, asc, inArray, desc } from "drizzle-orm";
import { cache } from "react";
import { HISTORICAL_RETURNS, type MonthlyReturn } from "@/features/bond-core/constants/historical-data";

import { CalculationDataFreshness, HistoricalAverages } from "@/features/bond-core/types/scenarios";
import { differenceInDays, parseISO, format } from "date-fns";
import { BondDefinition } from "@/features/bond-core/constants/bond-definitions";
import { BondType, InterestPayout } from "@/features/bond-core/types";

// High-performance cache for macro data and definitions
const macroCache = new Map<string, { data: unknown, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

function getCached<T>(key: string): T | null {
  const cached = macroCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: unknown) {
  macroCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Calculates the global data freshness status based on the oldest macro series.
 */
export const getGlobalDataFreshness = cache(async (): Promise<CalculationDataFreshness> => {
  const cacheKey = 'global-freshness';
  const cached = getCached<CalculationDataFreshness>(cacheKey);
  if (cached) return cached;

  const allSeries = await db.query.dataSeries.findMany();
  
  if (allSeries.length === 0) {
    return {
      status: 'unknown',
      usedFallback: true,
    };
  }

  // Define what we consider "stale" (e.g. older than 45 days for monthly macro data)
  const STALE_THRESHOLD_DAYS = 45;
  const today = new Date();
  
  let oldestDate: Date | null = null;
  let usedFallback = false;

  allSeries.forEach(s => {
    if (!s.lastDataPointDate) {
      usedFallback = true;
      return;
    }
    const d = parseISO(s.lastDataPointDate);
    if (!oldestDate || d < oldestDate) {
      oldestDate = d;
    }
  });

  if (!oldestDate) {
    return { status: 'unknown', usedFallback: true };
  }

  const daysOld = differenceInDays(today, oldestDate);
  const status = daysOld > STALE_THRESHOLD_DAYS ? 'stale' : 'fresh';

  const result: CalculationDataFreshness = {
    status: status as import('@/features/bond-core/types/scenarios').DataFreshnessStatus,
    asOf: format(oldestDate, 'yyyy-MM'),
    usedFallback
  };
  setCache(cacheKey, result);
  return result;
});

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
  seriesAvailability?: {
    sp500: boolean;
    gold: boolean;
    inflation: boolean;
    nbpRate: boolean;
  };
}

/**
 * Fetches historical data for multiple indicators and returns them as a map keyed by YYYY-MM.
 */
export const getHistoricalDataMap = cache(async (fromDate: string, toDate: string) => {
  const cacheKey = `historical-map-${fromDate}-${toDate}`;
  const cached = getCached<Record<string, { inflation?: number; nbpRate?: number }>>(cacheKey);
  if (cached) return cached;

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
  
  // Overwrite with real database points if available
  points.forEach(item => {
    const key = item.date.substring(0, 7); // YYYY-MM
    if (!map[key]) map[key] = {};
    
    const val = parseFloat(item.value);
    if (item.seriesId === cpiSeries?.id) map[key].inflation = val;
    if (item.seriesId === nbpSeries?.id) map[key].nbpRate = val;
  });

  setCache(cacheKey, map);
  return map;
});

import { BOND_DEFINITIONS } from "@/features/bond-core/constants/bond-definitions";

/**
 * Fetches all bond definitions from the database and maps them to BondDefinition interface.
 */
export const getBondDefinitions = cache(async (): Promise<BondDefinition[]> => {
  const cacheKey = 'bond-definitions';
  const cached = getCached<BondDefinition[]>(cacheKey);
  if (cached) return cached;

  const bonds = await db.query.polishBonds.findMany();

  if (bonds.length === 0) {
    return Object.values(BOND_DEFINITIONS);
  }

  const result = bonds.map(b => {

    const symbol = b.symbol as BondType;
    
    return {
      type: symbol,
      name: b.symbol,
      fullName: {
        pl: b.fullName,
        en: b.fullNameEn || b.fullName,
      },
      description: {
        pl: b.description || '',
        en: b.descriptionEn || '',
      },
      duration: b.durationDays / 365,
      nominalValue: parseFloat(b.nominalValue || "100"),
      isCapitalized: (b.capitalizationFreqDays || 0) > 0,
      payoutFrequency: (b.payoutFreqDays || 0) === 30 ? InterestPayout.MONTHLY : (b.payoutFreqDays || 0) === 365 ? InterestPayout.YEARLY : InterestPayout.MATURITY,
      firstYearRate: parseFloat(b.firstYearRate || "0"),
      margin: parseFloat(b.baseMargin || "0"),
      earlyWithdrawalFee: parseFloat(b.withdrawalFee || "0"),
      isInflationIndexed: b.interestType === "inflation_linked",
      isFloating: b.interestType === "floating_nbp",
      isFamilyOnly: b.isFamilyOnly || false,
      rebuyDiscount: parseFloat(b.rolloverDiscount || "0"),
    };
  });

  setCache(cacheKey, result);
  return result;
});

export const getBondDefinitionsMap = cache(async (): Promise<Record<BondType, BondDefinition>> => {
  const defs = await getBondDefinitions();
  return defs.reduce((acc, def) => {
    acc[def.type] = def;
    return acc;
  }, {} as Record<BondType, BondDefinition>);
});

/**
 * Fetches tax limits for a specific year from the DB.
 */
export const getTaxRulesForYear = cache(async (year: number) => {
  const cacheKey = `tax-rules-${year}`;
  const cached = getCached<typeof taxRules.$inferSelect>(cacheKey);
  if (cached) return cached;

  const rules = await db.query.taxRules.findFirst({
    where: eq(taxRules.year, year),
  });

  if (!rules) {
    // Fallback to latest available year
    const latest = await db.query.taxRules.findFirst({
      orderBy: [desc(taxRules.year)],
    });
    return latest;
  }

  setCache(cacheKey, rules);
  return rules;
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
  const cacheKey = 'multi-asset-history';
  const cached = getCached<MultiAssetHistoryEnvelope>(cacheKey);
  if (cached) return cached;

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
    const seriesAvailability = {
      sp500: sp500Points.length >= 2,
      gold: goldPoints.length >= 2,
      inflation: inflationPoints.length > 0,
      nbpRate: nbpPoints.length > 0,
    };

    if (sp500Points.length < 2 || goldPoints.length < 2 || inflationPoints.length === 0) {
      const fbResult: MultiAssetHistoryEnvelope = {
        data: HISTORICAL_RETURNS,
        source: 'fallback',
        usedFallback: true,
        coverageStart: fallbackCoverageStart,
        coverageEnd: fallbackCoverageEnd,
        seriesAvailability,
      };
      setCache(cacheKey, fbResult);
      return fbResult;
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
      const fbResult: MultiAssetHistoryEnvelope = {
        data: HISTORICAL_RETURNS,
        source: 'fallback',
        usedFallback: true,
        coverageStart: fallbackCoverageStart,
        coverageEnd: fallbackCoverageEnd,
        seriesAvailability,
      };
      setCache(cacheKey, fbResult);
      return fbResult;
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
    return {
      data: HISTORICAL_RETURNS,
      source: 'fallback',
      usedFallback: true,
      coverageStart: fallbackCoverageStart,
      coverageEnd: fallbackCoverageEnd,
      seriesAvailability: {
        sp500: false,
        gold: false,
        inflation: false,
        nbpRate: false,
      },
    };
  }
});

/**
 * Calculates historical averages for CPI and NBP rates over various timeframes.
 */
export const getHistoricalAverages = cache(async (): Promise<HistoricalAverages> => {
  const cacheKey = "historical-averages";
  const cached = getCached<HistoricalAverages>(cacheKey);
  if (cached) return cached;

  const { data } = await getMultiAssetHistory();

  const calculateAverage = (items: MonthlyReturn[], key: "inflation" | "nbpRate", months: number) => {
    const recent = items.slice(-months);
    if (recent.length === 0) return 0;
    const sum = recent.reduce((acc, curr) => acc + (curr[key] || 0), 0);
    return sum / recent.length;
  };

  const result: HistoricalAverages = {
    inflation: {
      "1y": calculateAverage(data, "inflation", 12),
      "5y": calculateAverage(data, "inflation", 60),
      "10y": calculateAverage(data, "inflation", 120),
    },
    nbpRate: {
      "1y": calculateAverage(data, "nbpRate", 12),
      "5y": calculateAverage(data, "nbpRate", 60),
      "10y": calculateAverage(data, "nbpRate", 120),
    },
  };

  setCache(cacheKey, result);
  return result;
});
