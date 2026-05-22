import { db } from "@/db";
import { bondSeries, dataSeries, dataPoints, taxRules, type BondSeries, type PolishBond } from "@/db/schema";
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

function getSeriesReferenceDate(series: {
  slug: string;
  frequency?: string | null;
  lastDataPointDate?: string | null;
  updatedAt?: Date | null;
}) {
  if (series.frequency === 'on-event' || NBP_RATE_SLUGS.includes(series.slug)) {
    return series.updatedAt ?? (series.lastDataPointDate ? parseISO(series.lastDataPointDate) : undefined);
  }

  return series.lastDataPointDate ? parseISO(series.lastDataPointDate) : series.updatedAt ?? undefined;
}

/**
 * Calculates the global data freshness status based on the oldest macro series.
 */
export const getGlobalDataFreshness = cache(async (): Promise<CalculationDataFreshness> => {
  const cacheKey = 'global-freshness';
  const cached = getCached<CalculationDataFreshness>(cacheKey);
  if (cached) return cached;

  const criticalSeries = await db.query.dataSeries.findMany({
    where: inArray(dataSeries.slug, [...CPI_SLUGS, ...NBP_RATE_SLUGS]),
  });

  if (criticalSeries.length === 0) {
    return {
      status: 'unknown',
      usedFallback: true,
    };
  }

  const STALE_THRESHOLD_DAYS = 45;
  const now = new Date();
  const latestSyncCheck = criticalSeries
    .map((series) => series.updatedAt)
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const seriesWithDates = criticalSeries
    .map((series) => ({
      series,
      referenceDate: getSeriesReferenceDate(series),
    }))
    .filter(
      (
        item,
      ): item is {
        series: (typeof criticalSeries)[number];
        referenceDate: Date;
      } => item.referenceDate instanceof Date,
    );
  const usedFallback = seriesWithDates.length !== criticalSeries.length
    || criticalSeries.some((series) => series.lastSyncStatus === 'failed');

  if (!seriesWithDates.length) {
    const result: CalculationDataFreshness = {
      status: 'unknown',
      asOf: latestSyncCheck ? format(latestSyncCheck, 'yyyy-MM-dd') : undefined,
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
  const status = usedFallback
    ? 'fallback'
    : daysOld > STALE_THRESHOLD_DAYS
      ? 'stale'
      : 'fresh';

  const result: CalculationDataFreshness = {
    status: status as import('@/features/bond-core/types/scenarios').DataFreshnessStatus,
    asOf: oldestCriticalPoint ? format(oldestCriticalPoint, 'yyyy-MM') : undefined,
    lastCheck: latestSyncCheck?.toISOString(),
    usedFallback,
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

/**
 * Returns the latest synced CPI and NBP reference-rate values for calculator defaults.
 */
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

import { BOND_DEFINITIONS } from "@/features/bond-core/constants/bond-definitions";

function parseNumeric(value: string | null | undefined, fallback: number) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildActiveSeriesMap(series: BondSeries[], asOfDate: string) {
  return series.reduce<Record<string, BondSeries>>((acc, item) => {
    if (item.sellStartDate > asOfDate) {
      return acc;
    }

    const existing = acc[item.bondTypeId];
    if (!existing || existing.emissionMonth < item.emissionMonth) {
      acc[item.bondTypeId] = item;
    }

    return acc;
  }, {});
}

function shouldPreferBootstrapFirstPeriodRate(
  bond: PolishBond,
  symbol: BondType,
) {
  return bond.interestType === 'floating_nbp'
    && (symbol === BondType.ROR || symbol === BondType.DOR);
}

function isBondOfferFresh(updatedAt?: Date | null) {
  if (!updatedAt) {
    return false;
  }

  return differenceInDays(new Date(), updatedAt) <= 45;
}

export function mergeBondDefinitionsWithSeries(
  bonds: PolishBond[],
  series: BondSeries[],
  fallbackDefinitions: Record<BondType, BondDefinition>,
  asOfDate = new Date().toISOString().slice(0, 10),
): BondDefinition[] {
  if (bonds.length === 0) {
    return Object.values(fallbackDefinitions);
  }

  const activeSeriesByBondTypeId = buildActiveSeriesMap(series, asOfDate);

  return bonds.map((bond) => {
    const symbol = bond.symbol as BondType;
    const bootstrap = fallbackDefinitions[symbol];
    const activeSeries = activeSeriesByBondTypeId[bond.id];
    const useDatabaseFallback = isBondOfferFresh(bond.updatedAt);
    const fallbackFirstYearRate = useDatabaseFallback
      ? parseNumeric(bond.firstYearRate, bootstrap.firstYearRate)
      : bootstrap.firstYearRate;
    const fallbackMargin = useDatabaseFallback
      ? parseNumeric(bond.baseMargin, bootstrap.margin)
      : bootstrap.margin;

    return {
      type: symbol,
      name: bond.symbol,
      fullName: {
        pl: bond.fullName || bootstrap.fullName.pl,
        en: bond.fullNameEn || bond.fullName || bootstrap.fullName.en,
      },
      description: {
        pl: bond.description || bootstrap.description.pl,
        en: bond.descriptionEn || bootstrap.description.en,
      },
      duration: bond.durationDays ? bond.durationDays / 365 : bootstrap.duration,
      nominalValue: parseNumeric(bond.nominalValue, bootstrap.nominalValue),
      isCapitalized:
        bond.capitalizationFreqDays === null || bond.capitalizationFreqDays === undefined
          ? bootstrap.isCapitalized
          : bond.capitalizationFreqDays > 0,
      payoutFrequency:
        (bond.payoutFreqDays || 0) === 30
          ? InterestPayout.MONTHLY
          : (bond.payoutFreqDays || 0) === 365
            ? InterestPayout.YEARLY
            : InterestPayout.MATURITY,
      firstYearRate: activeSeries
        ? parseNumeric(activeSeries.firstYearRate, bootstrap.firstYearRate)
        : shouldPreferBootstrapFirstPeriodRate(bond, symbol)
          ? bootstrap.firstYearRate
          : fallbackFirstYearRate,
      margin: activeSeries
        ? parseNumeric(activeSeries.baseMargin, bootstrap.margin)
        : fallbackMargin,
      earlyWithdrawalFee: parseNumeric(bond.withdrawalFee, bootstrap.earlyWithdrawalFee),
      isInflationIndexed:
        bond.interestType === 'inflation_linked'
          ? true
          : bond.interestType === 'floating_nbp'
            ? false
            : bootstrap.isInflationIndexed,
      isFloating:
        bond.interestType === 'floating_nbp'
          ? true
          : bond.interestType === 'inflation_linked'
            ? false
            : bootstrap.isFloating,
      isFamilyOnly: bond.isFamilyOnly ?? bootstrap.isFamilyOnly ?? false,
      rebuyDiscount: parseNumeric(bond.rolloverDiscount, bootstrap.rebuyDiscount),
    };
  });
}

/**
 * Fetches all bond definitions from the database and maps them to BondDefinition interface.
 */
export const getBondDefinitions = cache(async (): Promise<BondDefinition[]> => {
  const cacheKey = 'bond-definitions';
  const cached = getCached<BondDefinition[]>(cacheKey);
  if (cached) return cached;

  const [bonds, series] = await Promise.all([
    db.query.polishBonds.findMany(),
    db.query.bondSeries.findMany({
      orderBy: [desc(bondSeries.emissionMonth)],
    }),
  ]);

  if (bonds.length === 0) {
    return Object.values(BOND_DEFINITIONS);
  }
  const result = mergeBondDefinitionsWithSeries(
    bonds,
    series,
    BOND_DEFINITIONS,
  );

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
    // Batch fetch all relevant series in one query
    const allAliases = [...SP500_SLUGS, ...GOLD_SLUGS, ...CPI_SLUGS, ...NBP_RATE_SLUGS];
    const series = await db.query.dataSeries.findMany({
      where: inArray(dataSeries.slug, allAliases),
    });

    if (series.length === 0) {
      throw new Error('No data series found');
    }

    const seriesIds = series.map(s => s.id);
    const sp500Id = series.find(s => SP500_SLUGS.includes(s.slug))?.id;
    const goldId = series.find(s => GOLD_SLUGS.includes(s.slug))?.id;
    const cpiId = series.find(s => CPI_SLUGS.includes(s.slug))?.id;
    const nbpId = series.find(s => NBP_RATE_SLUGS.includes(s.slug))?.id;

    // Batch fetch all points for all series in one query
    const allPoints = await db.query.dataPoints.findMany({
      where: and(
        inArray(dataPoints.seriesId, seriesIds),
        gte(dataPoints.date, fromDate),
        lte(dataPoints.date, toDate),
      ),
      orderBy: [asc(dataPoints.date)],
    });

    // Group points by series
    const pointsBySeries: Record<string, { date: string; value: number }[]> = {};
    allPoints.forEach(p => {
      if (!pointsBySeries[p.seriesId]) pointsBySeries[p.seriesId] = [];
      pointsBySeries[p.seriesId].push({
        date: p.date.substring(0, 7),
        value: parseFloat(p.value)
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
