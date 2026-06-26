import { MonthlyReturn } from '@/features/bond-core/constants/historical-data';

export type MultiAssetDraftState = {
  initialSum: number;
  monthlyContribution: number;
  startYear: string;
  startMonth: string;
  showRealValue: boolean;
};

export function getDefaultMultiAssetDraftState(history: MonthlyReturn[]): MultiAssetDraftState {
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

export function buildMultiAssetDraftStateFromQuery(
  initial: Record<string, string | string[] | number | boolean | undefined>,
  defaultState: MultiAssetDraftState,
): MultiAssetDraftState {
  return {
    initialSum: initial.sum !== undefined ? Number(initial.sum) : defaultState.initialSum,
    monthlyContribution:
      initial.monthly !== undefined ? Number(initial.monthly) : defaultState.monthlyContribution,
    startYear: initial.year ? String(initial.year) : defaultState.startYear,
    startMonth: initial.month ? String(initial.month) : defaultState.startMonth,
    showRealValue:
      initial.real !== undefined ? String(initial.real) === 'true' : defaultState.showRealValue,
  };
}
