import { useCallback, useMemo, useState } from 'react';
import {
  calculateAssetPerformance,
  calculateBondsPerformance,
  calculateSavingsPerformance,
} from '../../bond-core/utils/asset-calculations';
import { AssetMetadata } from '../../bond-core/types/assets';
import { HISTORICAL_RETURNS, type MonthlyReturn } from '../../bond-core/constants/historical-data';
import { useQuerySync } from '@/shared/hooks/useQuerySync';
import { useChartData } from '@/shared/hooks/useChartData';
import {
  getReferenceAsOfLabel,
  getReferenceCoverageLabel,
  getReferenceSourceLabel,
} from '@/shared/lib/data-reference';

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

type DraftState = {
  initialSum: number;
  monthlyContribution: number;
  startYear: string;
  startMonth: string;
  showRealValue: boolean;
};

const ASSETS_METADATA: Record<string, AssetMetadata> = {
  sp500: {
    id: 'sp500',
    name: 'S&P 500',
    color: '#2563eb',
    description: {
      en: 'US equities benchmark with high growth and high volatility.',
      pl: 'Benchmark akcji z USA o wysokim wzroscie i wysokiej zmiennosci.',
    },
  },
  gold: {
    id: 'gold',
    name: 'Gold',
    color: '#db2777',
    description: {
      en: 'Gold priced through historical market data.',
      pl: 'Zloto liczone na podstawie danych historycznych.',
    },
  },
  bonds: {
    id: 'bonds',
    name: 'EDO bonds',
    color: '#d97706',
    description: {
      en: 'Ten-year inflation-indexed treasury bond scenario.',
      pl: 'Scenariusz dla dziesiecioletnich obligacji EDO.',
    },
  },
  savings: {
    id: 'savings',
    name: 'Savings account',
    color: '#64748b',
    description: {
      en: 'Savings account scenario linked to historical NBP rates.',
      pl: 'Scenariusz konta oszczednosciowego powiazanego ze stopami NBP.',
    },
  },
};

function getDefaultDraftState(history: MonthlyReturn[]): DraftState {
  const firstDate = history[0]?.date ?? '2020-01';
  const [startYear, startMonth] = firstDate.split('-');

  return {
    initialSum: 10000,
    monthlyContribution: 500,
    startYear,
    startMonth,
    showRealValue: false,
  };
}

export function useMultiAssetComparison() {
  const { data: historyResponse, isLoading } = useChartData<MultiAssetHistoryResponse>(
    '/api/charts/multi-asset-history',
  );

  const sourceData = historyResponse?.data?.length ? historyResponse.data : HISTORICAL_RETURNS;
  const effectiveCoverageStart =
    historyResponse?.coverageStart ?? HISTORICAL_RETURNS[0]?.date ?? '2020-01';
  const effectiveCoverageEnd =
    historyResponse?.coverageEnd ??
    HISTORICAL_RETURNS[HISTORICAL_RETURNS.length - 1]?.date ??
    '2024-06';

  const defaultState = useMemo(() => getDefaultDraftState(sourceData), [sourceData]);
  const [draft, setDraft] = useState<DraftState>(defaultState);
  const [committed, setCommitted] = useState<DraftState>(defaultState);
  const [isDirty, setIsDirty] = useState(true);

  const setDraftPartial = useCallback((patch: Partial<DraftState>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setIsDirty(true);
  }, []);

  const updateInitialSum = useCallback(
    (value: number) => {
      setDraftPartial({ initialSum: value });
    },
    [setDraftPartial],
  );

  const updateMonthlyContribution = useCallback(
    (value: number) => {
      setDraftPartial({ monthlyContribution: value });
    },
    [setDraftPartial],
  );

  const updateStartYear = useCallback(
    (value: string) => {
      setDraftPartial({ startYear: value });
    },
    [setDraftPartial],
  );

  const updateStartMonth = useCallback(
    (value: string) => {
      setDraftPartial({ startMonth: value });
    },
    [setDraftPartial],
  );

  const updateShowRealValue = useCallback((value: boolean) => {
    setDraft((current) => ({ ...current, showRealValue: value }));
  }, []);

  const recalculate = useCallback(() => {
    setCommitted(draft);
    setIsDirty(false);
  }, [draft]);

  useQuerySync(
    {
      sum: draft.initialSum,
      monthly: draft.monthlyContribution,
      year: draft.startYear || undefined,
      month: draft.startMonth || undefined,
      real: draft.showRealValue,
    },
    (initial) => {
      const nextDraft: DraftState = {
        initialSum: initial.sum !== undefined ? Number(initial.sum) : defaultState.initialSum,
        monthlyContribution:
          initial.monthly !== undefined
            ? Number(initial.monthly)
            : defaultState.monthlyContribution,
        startYear: initial.year ? String(initial.year) : defaultState.startYear,
        startMonth: initial.month ? String(initial.month) : defaultState.startMonth,
        showRealValue:
          initial.real !== undefined ? String(initial.real) === 'true' : defaultState.showRealValue,
      };

      setDraft(nextDraft);
      setCommitted(nextDraft);
      setIsDirty(false);
    },
  );

  const filteredData = useMemo(() => {
    const effectiveStartDate = `${committed.startYear}-${committed.startMonth}`;
    const data = sourceData.filter((row) => row.date >= effectiveStartDate);
    return data.length > 0 ? data : sourceData;
  }, [committed.startMonth, committed.startYear, sourceData]);

  const sp500 = useMemo(
    () =>
      calculateAssetPerformance(
        committed.initialSum,
        committed.monthlyContribution,
        'sp500',
        ASSETS_METADATA.sp500,
        filteredData,
      ),
    [committed.initialSum, committed.monthlyContribution, filteredData],
  );

  const gold = useMemo(
    () =>
      calculateAssetPerformance(
        committed.initialSum,
        committed.monthlyContribution,
        'gold',
        ASSETS_METADATA.gold,
        filteredData,
      ),
    [committed.initialSum, committed.monthlyContribution, filteredData],
  );

  const bonds = useMemo(
    () =>
      calculateBondsPerformance(
        committed.initialSum,
        committed.monthlyContribution,
        ASSETS_METADATA.bonds,
        filteredData,
      ),
    [committed.initialSum, committed.monthlyContribution, filteredData],
  );

  const savings = useMemo(
    () =>
      calculateSavingsPerformance(
        committed.initialSum,
        committed.monthlyContribution,
        ASSETS_METADATA.savings,
        filteredData,
      ),
    [committed.initialSum, committed.monthlyContribution, filteredData],
  );

  const purchasingPowerLoss = useMemo(() => {
    let cumulativeInflation = 1;
    let totalInvested = committed.initialSum;

    for (const row of filteredData) {
      cumulativeInflation *= 1 + (row.inflation || 0) / 100;
      totalInvested += committed.monthlyContribution;
    }

    if (cumulativeInflation <= 0) {
      return 0;
    }

    return totalInvested - totalInvested / cumulativeInflation;
  }, [committed.initialSum, committed.monthlyContribution, filteredData]);

  const years = useMemo(() => {
    const uniqueYears = Array.from(new Set(sourceData.map((row) => row.date.substring(0, 4))));
    return uniqueYears.sort((left, right) => right.localeCompare(left));
  }, [sourceData]);

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, index) => (index + 1).toString().padStart(2, '0')),
    [],
  );

  return {
    initialSum: draft.initialSum,
    updateInitialSum,
    monthlyContribution: draft.monthlyContribution,
    updateMonthlyContribution,
    startDate: `${committed.startYear}-${committed.startMonth}`,
    startYear: draft.startYear,
    updateStartYear,
    startMonth: draft.startMonth,
    updateStartMonth,
    years,
    months,
    showRealValue: draft.showRealValue,
    updateShowRealValue,
    isDirty,
    isLoading,
    recalculate,
    assets: [sp500, gold, bonds, savings],
    purchasingPowerLoss,
    metadata: ASSETS_METADATA,
    availableDates: sourceData.map((row) => row.date),
    historySource: historyResponse?.source ?? 'fallback',
    historySourceLabel: getReferenceSourceLabel(historyResponse),
    historyCoverageLabel: getReferenceCoverageLabel(historyResponse),
    historyAsOfLabel: getReferenceAsOfLabel(historyResponse),
    historyCoverageStart: effectiveCoverageStart,
    historyCoverageEnd: effectiveCoverageEnd,
    usedFallbackHistory: historyResponse?.usedFallback ?? true,
    historyLastSyncedAt: historyResponse?.lastSyncedAt,
    historySeriesAvailability: historyResponse?.seriesAvailability,
    historyData: filteredData,
    committedScenario: committed,
  };
}
