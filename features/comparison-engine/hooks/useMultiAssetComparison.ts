import { useMemo, useState } from 'react';
import { calculateAssetPerformance, calculateBondsPerformance } from '../../bond-core/utils/asset-calculations';
import { AssetMetadata } from '../../bond-core/types/assets';
import { HISTORICAL_RETURNS, type MonthlyReturn } from '../../bond-core/constants/historical-data';
import { useQuerySync } from '@/shared/hooks/useQuerySync';
import { useChartData } from '@/shared/hooks/useChartData';

interface MultiAssetHistoryResponse {
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

const ASSETS_METADATA: Record<string, AssetMetadata> = {
  sp500: {
    id: 'sp500',
    name: 'S&P 500 (Stocks)',
    color: '#3b82f6',
    description: {
      en: '500 largest US companies. High growth, high volatility.',
      pl: '500 najwiekszych spolek w USA. Wysoki wzrost, wysoka zmiennosc.',
    },
  },
  gold: {
    id: 'gold',
    name: 'Gold (XAU)',
    color: '#f59e0b',
    description: {
      en: 'Safe-haven asset. Protects purchasing power.',
      pl: 'Aktywo "bezpieczna przystan". Chroni sile nabywcza.',
    },
  },
  bonds: {
    id: 'bonds',
    name: 'Bonds (EDO)',
    color: '#10b981',
    description: {
      en: 'Inflation-indexed government bonds. Safe and steady.',
      pl: 'Obligacje skarbowe indeksowane inflacja. Bezpieczne i stabilne.',
    },
  },
  savings: {
    id: 'savings',
    name: 'Savings Account',
    color: '#94a3b8',
    description: {
      en: 'Low-risk, low-reward cash account.',
      pl: 'Niskie ryzyko, niski zysk. Konto oszczednosciowe.',
    },
  },
};

export function useMultiAssetComparison() {
  const [initialSum, setInitialSum] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [startYear, setStartYear] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [showRealValue, setShowRealValue] = useState(false);
  const [isDirty, setIsDirty] = useState(true);
  const { data: historyResponse, isLoading } = useChartData<MultiAssetHistoryResponse>('/api/charts/multi-asset-history');

  const updateInitialSum = (val: number) => {
    setInitialSum(val);
    setIsDirty(true);
  };

  const updateMonthlyContribution = (val: number) => {
    setMonthlyContribution(val);
    setIsDirty(true);
  };

  const updateStartYear = (val: string) => {
    setStartYear(val);
    setIsDirty(true);
  };

  const updateStartMonth = (val: string) => {
    setStartMonth(val);
    setIsDirty(true);
  };

  const updateShowRealValue = (val: boolean) => {
    setShowRealValue(val);
  };

  const recalculate = () => {
    setIsDirty(false);
  };

  useQuerySync(
    {
      sum: initialSum,
      monthly: monthlyContribution,
      year: startYear || undefined,
      month: startMonth || undefined,
      real: showRealValue,
    },
    (initial) => {
      if (initial.sum) setInitialSum(Number(initial.sum));
      if (initial.monthly) setMonthlyContribution(Number(initial.monthly));
      if (initial.year) setStartYear(String(initial.year));
      if (initial.month) setStartMonth(String(initial.month));
      if (initial.real !== undefined) setShowRealValue(String(initial.real) === 'true');
    },
  );

  const sourceData = historyResponse?.data?.length ? historyResponse.data : HISTORICAL_RETURNS;
  const effectiveCoverageStart = historyResponse?.coverageStart ?? HISTORICAL_RETURNS[0]?.date ?? '2020-01';
  const effectiveCoverageEnd = historyResponse?.coverageEnd ?? HISTORICAL_RETURNS[HISTORICAL_RETURNS.length - 1]?.date ?? '2024-06';
  const [coverageYear, coverageMonth] = effectiveCoverageStart.split('-');
  const effectiveStartYear = startYear || coverageYear;
  const effectiveStartMonth = startMonth || coverageMonth;

  const filteredData = useMemo(() => {
    const effectiveStartDate = `${effectiveStartYear}-${effectiveStartMonth}`;
    const data = sourceData.filter((row) => row.date >= effectiveStartDate);
    return data.length > 0 ? data : sourceData;
  }, [effectiveStartMonth, effectiveStartYear, sourceData]);

  const sp500 = useMemo(
    () => calculateAssetPerformance(initialSum, monthlyContribution, 'sp500', ASSETS_METADATA.sp500, filteredData),
    [initialSum, monthlyContribution, filteredData],
  );

  const gold = useMemo(
    () => calculateAssetPerformance(initialSum, monthlyContribution, 'gold', ASSETS_METADATA.gold, filteredData),
    [initialSum, monthlyContribution, filteredData],
  );

  const bonds = useMemo(
    () => calculateBondsPerformance(initialSum, monthlyContribution, ASSETS_METADATA.bonds, filteredData),
    [initialSum, monthlyContribution, filteredData],
  );

  const savings = useMemo(
    () => calculateAssetPerformance(initialSum, monthlyContribution, 'savings', ASSETS_METADATA.savings, filteredData),
    [initialSum, monthlyContribution, filteredData],
  );

  const years = useMemo(() => {
    const uniqueYears = Array.from(new Set(sourceData.map((row) => row.date.substring(0, 4))));
    return uniqueYears.sort((a, b) => b.localeCompare(a));
  }, [sourceData]);

  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  return {
    initialSum,
    updateInitialSum,
    monthlyContribution,
    updateMonthlyContribution,
    startDate: `${effectiveStartYear}-${effectiveStartMonth}`,
    startYear: effectiveStartYear,
    updateStartYear,
    startMonth: effectiveStartMonth,
    updateStartMonth,
    years,
    months,
    showRealValue,
    updateShowRealValue,
    isDirty,
    isLoading,
    recalculate,
    assets: [sp500, gold, bonds, savings],
    metadata: ASSETS_METADATA,
    availableDates: sourceData.map((row) => row.date),
    historySource: historyResponse?.source ?? 'fallback',
    historyCoverageStart: effectiveCoverageStart,
    historyCoverageEnd: effectiveCoverageEnd,
    usedFallbackHistory: historyResponse?.usedFallback ?? true,
    historyLastSyncedAt: historyResponse?.lastSyncedAt,
    historySeriesAvailability: historyResponse?.seriesAvailability,
    historyData: sourceData,
  };
}
