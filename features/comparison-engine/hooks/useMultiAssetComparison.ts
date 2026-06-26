import { useCallback, useMemo, useState } from 'react';

import { useChartData } from '@/shared/hooks/useChartData';
import { useQuerySync } from '@/shared/hooks/useQuerySync';
import {
  getReferenceAsOfLabel,
  getReferenceCoverageLabel,
  getReferenceSourceLabel,
} from '@/shared/lib/data-reference';

import { HISTORICAL_RETURNS, type MonthlyReturn } from '../../bond-core/constants/historical-data';
import {
  calculateAssetPerformance,
  calculateBondsPerformance,
  calculateSavingsPerformance,
} from '../../bond-core/utils/asset-calculations';
import { ASSETS_METADATA } from '../constants/multi-asset';
import {
  buildMultiAssetDraftStateFromQuery,
  getDefaultMultiAssetDraftState,
  type MultiAssetDraftState,
} from '../lib/multi-asset-state';

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

  const defaultState = useMemo(() => getDefaultMultiAssetDraftState(sourceData), [sourceData]);
  const [draft, setDraft] = useState<MultiAssetDraftState>(defaultState);
  const [committed, setCommitted] = useState<MultiAssetDraftState>(defaultState);
  const [isDirty, setIsDirty] = useState(true);

  const setDraftPartial = useCallback((patch: Partial<MultiAssetDraftState>) => {
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
      const nextDraft = buildMultiAssetDraftStateFromQuery(initial, defaultState);

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
