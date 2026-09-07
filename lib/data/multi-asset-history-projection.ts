import { type MonthlyReturn } from '@/features/bond-core/constants/historical-data';

export interface MultiAssetSeriesAvailability {
  sp500: boolean;
  gold: boolean;
  inflation: boolean;
  nbpRate: boolean;
}

export interface MultiAssetHistoryEnvelope {
  data: MonthlyReturn[];
  source: 'database' | 'fallback';
  usedFallback: boolean;
  coverageStart: string;
  coverageEnd: string;
  lastSyncedAt?: string;
  seriesAvailability?: MultiAssetSeriesAvailability;
}

export interface MultiAssetHistorySource {
  sp500: Array<{ date: string; value: number }>;
  gold: Array<{ date: string; value: number }>;
  inflation: Array<{ date: string; value: number }>;
  nbpRate: Array<{ date: string; value: number }>;
}

function buildMonthlyPercentChangeMap(series: Array<{ date: string; value: number }>) {
  const result = new Map<string, number>();

  for (let index = 0; index < series.length; index += 1) {
    const current = series[index];
    const previous = series[index - 1];
    result.set(
      current.date,
      !previous || previous.value === 0
        ? 0
        : ((current.value - previous.value) / previous.value) * 100,
    );
  }

  return result;
}

export function getMultiAssetSeriesAvailability(
  source: MultiAssetHistorySource,
): MultiAssetSeriesAvailability {
  return {
    sp500: source.sp500.length >= 2,
    gold: source.gold.length >= 2,
    inflation: source.inflation.length > 0,
    nbpRate: source.nbpRate.length > 0,
  };
}

/** Pure projection: callers retain ownership of database, cache, and fallback policy. */
export function buildMultiAssetHistory(
  source: MultiAssetHistorySource,
): MultiAssetHistoryEnvelope | null {
  const seriesAvailability = getMultiAssetSeriesAvailability(source);
  if (!seriesAvailability.sp500 || !seriesAvailability.gold || !seriesAvailability.inflation) {
    return null;
  }

  const sp500Returns = buildMonthlyPercentChangeMap(source.sp500);
  const goldReturns = buildMonthlyPercentChangeMap(source.gold);
  const inflationMap = new Map(source.inflation.map((point) => [point.date, point.value]));
  const nbpMap = new Map(source.nbpRate.map((point) => [point.date, point.value]));
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
      return {
        date,
        sp500: sp500Returns.get(date) ?? 0,
        gold: goldReturns.get(date) ?? 0,
        savings: (Math.pow(1 + annualSavingsRate / 100, 1 / 12) - 1) * 100 * 0.81,
        inflation: inflationMap.get(date) ?? 0,
        nbpRate,
      };
    });

  if (data.length === 0) {
    return null;
  }

  return {
    data,
    source: 'database',
    usedFallback: !seriesAvailability.nbpRate,
    coverageStart: data[0].date,
    coverageEnd: data[data.length - 1].date,
    lastSyncedAt: [...source.sp500, ...source.gold, ...source.inflation, ...source.nbpRate]
      .map((point) => point.date)
      .sort()
      .at(-1),
    seriesAvailability,
  };
}
