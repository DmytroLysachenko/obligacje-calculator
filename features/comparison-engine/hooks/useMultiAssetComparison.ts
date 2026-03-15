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
  const [startDate, setStartDate] = useState(HISTORICAL_RETURNS[0].date);
  const [showRealValue, setShowRealValue] = useState(false);
  
  // URL Sync
  useQuerySync({
    sum: initialSum,
    monthly: monthlyContribution,
    start: startDate,
    real: showRealValue
  }, (initial) => {
    if (initial.sum) setInitialSum(Number(initial.sum));
    if (initial.monthly) setMonthlyContribution(Number(initial.monthly));
    if (initial.start) setStartDate(String(initial.start));
    if (initial.real !== undefined) setShowRealValue(String(initial.real) === 'true');
  });

  const filteredData = useMemo(() => {
    return HISTORICAL_RETURNS.filter(row => row.date >= startDate);
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

  return {
    initialSum,
    setInitialSum,
    monthlyContribution,
    setMonthlyContribution,
    startDate,
    setStartDate,
    showRealValue,
    setShowRealValue,
    assets: [sp500, gold, bonds, savings],
    metadata: ASSETS_METADATA,
    availableDates: HISTORICAL_RETURNS.map(r => r.date),
  };
}
