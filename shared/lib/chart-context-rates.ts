import { differenceInMonths, parseISO } from 'date-fns';

import type { BondInputs } from '@/features/bond-core/types';

export interface ChartContextRateOverrides {
  inflation?: number;
  nbp?: number;
}

function readYearlyPathValue(path: number[] | undefined, yearIndex: number) {
  if (!path || path.length === 0) {
    return undefined;
  }

  return path[Math.min(Math.max(yearIndex, 0), path.length - 1)];
}

function getYearIndex(dateKey: string | undefined, purchaseDate: string | undefined) {
  if (!dateKey || !purchaseDate) {
    return 0;
  }

  const pointDate = parseISO(dateKey);
  const startDate = parseISO(purchaseDate);

  if (Number.isNaN(pointDate.getTime()) || Number.isNaN(startDate.getTime())) {
    return 0;
  }

  return Math.max(0, Math.floor(differenceInMonths(pointDate, startDate) / 12));
}

export function getChartContextRatesForDate(
  inputs: Pick<BondInputs, 'purchaseDate' | 'expectedInflation' | 'expectedNbpRate' | 'customInflation' | 'customNbpRate'>,
  dateKey: string | undefined,
): ChartContextRateOverrides {
  const yearIndex = getYearIndex(dateKey, inputs.purchaseDate);

  return {
    inflation: readYearlyPathValue(inputs.customInflation, yearIndex) ?? inputs.expectedInflation,
    nbp: readYearlyPathValue(inputs.customNbpRate, yearIndex) ?? inputs.expectedNbpRate,
  };
}

export function applyChartContextRates<T extends { dateKey?: string; inflation?: number; nbp?: number }>(
  points: T[],
  inputs: Pick<BondInputs, 'purchaseDate' | 'expectedInflation' | 'expectedNbpRate' | 'customInflation' | 'customNbpRate'>,
): T[] {
  return points.map((point) => {
    const contextRates = getChartContextRatesForDate(inputs, point.dateKey);

    return {
      ...point,
      inflation: contextRates.inflation ?? point.inflation,
      nbp: contextRates.nbp ?? point.nbp,
    };
  });
}
