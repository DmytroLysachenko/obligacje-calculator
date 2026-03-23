import { useState, useMemo } from 'react';
import { calculateAssetPerformance, calculateBondsPerformance } from '../../bond-core/utils/asset-calculations';
import { AssetMetadata } from '../../bond-core/types/assets';
import { HISTORICAL_RETURNS } from '../../bond-core/constants/historical-data';
import { useQuerySync } from '@/shared/hooks/useQuerySync';

const ASSETS_METADATA: Record<string, AssetMetadata> = {
  sp500: {
    id: 'sp500',
    name: 'S&P 500 (Stocks)',
    color: '#3b82f6',
    description: {
      en: '500 largest US companies. High growth, high volatility.',
      pl: '500 największych spółek w USA. Wysoki wzrost, wysoka zmienność.',
    },
  },
  gold: {
    id: 'gold',
    name: 'Gold (XAU)',
    color: '#f59e0b',
    description: {
      en: 'Safe-haven asset. Protects purchasing power.',
      pl: 'Aktywo "bezpieczna przystań". Chroni siłę nabywczą.',
    },
  },
  bonds: {
    id: 'bonds',
    name: 'Bonds (EDO)',
    color: '#10b981',
    description: {
      en: 'Inflation-indexed government bonds. Safe and steady.',
      pl: 'Obligacje skarbowe indeksowane inflacją. Bezpieczne i stabilne.',
    },
  },
  savings: {
    id: 'savings',
    name: 'Savings Account',
    color: '#94a3b8',
    description: {
      en: 'Low-risk, low-reward cash account.',
      pl: 'Niskie ryzyko, niski zysk. Konto oszczędnościowe.',
    },
  },
};

export function useMultiAssetComparison() {
  const [initialSum, setInitialSum] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  
  const [startYear, setStartYear] = useState('2020');
  const [startMonth, setStartMonth] = useState('01');
  
  const startDate = `${startYear}-${startMonth}`;
  const [showRealValue, setShowRealValue] = useState(false);
  const [isDirty, setIsDirty] = useState(true);

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
    // Real value toggle usually doesn't need recalculation if it's just a view change, 
    // but if it triggers heavy useMemo, we might want it. 
    // In this hook it affects useMemo below.
  };

  const recalculate = () => {
    setIsDirty(false);
  };
  
  // URL Sync
  useQuerySync({
    sum: initialSum,
    monthly: monthlyContribution,
    year: startYear,
    month: startMonth,
    real: showRealValue
  }, (initial) => {
    if (initial.sum) setInitialSum(Number(initial.sum));
    if (initial.monthly) setMonthlyContribution(Number(initial.monthly));
    if (initial.year) setStartYear(String(initial.year));
    if (initial.month) setStartMonth(String(initial.month));
    if (initial.real !== undefined) setShowRealValue(String(initial.real) === 'true');
  });

  const filteredData = useMemo(() => {
    const data = HISTORICAL_RETURNS.filter(row => row.date >= startDate);
    return data.length > 0 ? data : HISTORICAL_RETURNS.slice(-12); // Fallback
  }, [startDate]);

  const sp500 = useMemo(() => 
    calculateAssetPerformance(initialSum, monthlyContribution, 'sp500', ASSETS_METADATA.sp500, filteredData), 
  [initialSum, monthlyContribution, filteredData]);
  
  const gold = useMemo(() => 
    calculateAssetPerformance(initialSum, monthlyContribution, 'gold', ASSETS_METADATA.gold, filteredData), 
  [initialSum, monthlyContribution, filteredData]);
  
  const bonds = useMemo(() => 
    calculateBondsPerformance(initialSum, monthlyContribution, ASSETS_METADATA.bonds, filteredData),
  [initialSum, monthlyContribution, filteredData]);
  
  const savings = useMemo(() => 
    calculateAssetPerformance(initialSum, monthlyContribution, 'savings', ASSETS_METADATA.savings, filteredData), 
  [initialSum, monthlyContribution, filteredData]);

  const years = useMemo(() => {
    const uniqueYears = Array.from(new Set(HISTORICAL_RETURNS.map(r => r.date.substring(0, 4))));
    return uniqueYears.sort((a, b) => b.localeCompare(a));
  }, []);
  
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  return {
    initialSum,
    updateInitialSum,
    monthlyContribution,
    updateMonthlyContribution,
    startDate,
    startYear,
    updateStartYear,
    startMonth,
    updateStartMonth,
    years,
    months,
    showRealValue,
    updateShowRealValue,
    isDirty,
    recalculate,
    assets: [sp500, gold, bonds, savings],
    metadata: ASSETS_METADATA,
    availableDates: HISTORICAL_RETURNS.map(r => r.date),
  };
}
