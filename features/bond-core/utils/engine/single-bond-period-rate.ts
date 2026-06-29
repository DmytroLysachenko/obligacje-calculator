import { differenceInMonths } from 'date-fns';

import { BondInputs, BondType, HistoricalDataMap } from '../../types';

import { getHistoricalValue } from './historical-data';
import { getExpectedInflationForYearIndex } from './inflation';
import { resolveSingleBondRateContext, SingleBondRateContext } from './rate-context';

interface SingleBondPeriodRateInput {
  periodStartDate: Date;
  cyclePurchaseDate: Date;
  simulationStartDate: Date;
  bondType: BondType;
  firstYearRate: number;
  expectedInflation: BondInputs['expectedInflation'];
  expectedNbpRate: number;
  margin: number;
  isInflationIndexed: boolean;
  customInflation?: number[];
  customNbpRate?: number[];
  historicalData?: HistoricalDataMap;
}

export interface SingleBondPeriodRateState {
  monthsIntoCycle: number;
  periodYearIndex: number;
  activeExpectedInflation: number;
  lagInflation?: number;
  lagNbp?: number;
  customInflationValue?: number;
  customNbpValue?: number;
  rateContext: SingleBondRateContext;
  inflationReference: number;
  nbpReference: number;
}

export function resolveSingleBondPeriodRateState({
  periodStartDate,
  cyclePurchaseDate,
  simulationStartDate,
  bondType,
  firstYearRate,
  expectedInflation,
  expectedNbpRate,
  margin,
  isInflationIndexed,
  customInflation,
  customNbpRate,
  historicalData,
}: SingleBondPeriodRateInput): SingleBondPeriodRateState {
  const monthsIntoCycle = differenceInMonths(periodStartDate, cyclePurchaseDate);
  const periodYearIndex = Math.floor(differenceInMonths(periodStartDate, simulationStartDate) / 12);
  const activeExpectedInflation = getExpectedInflationForYearIndex(
    expectedInflation,
    customInflation,
    periodYearIndex,
  );

  const { value: lagInflation, isProjected: isInflationProjected } = getHistoricalValue(
    periodStartDate,
    'inflation',
    2,
    historicalData,
  );
  const { value: lagNbp, isProjected: isNbpProjected } = getHistoricalValue(
    periodStartDate,
    'nbpRate',
    0,
    historicalData,
  );

  const inflationResetYearIndex = Math.max(0, periodYearIndex - 1);
  const customInflationValue = customInflation?.[inflationResetYearIndex];
  const customNbpValue = customNbpRate?.[periodYearIndex];
  const rateContext = resolveSingleBondRateContext({
    bondType,
    monthsIntoCycle,
    firstYearRate,
    activeExpectedInflation,
    expectedNbpRate,
    margin,
    isInflationIndexed,
    lagInflation,
    lagNbp,
    customInflationValue,
    customNbpValue,
    isInflationProjected,
    isNbpProjected,
  });

  return {
    monthsIntoCycle,
    periodYearIndex,
    activeExpectedInflation,
    lagInflation,
    lagNbp,
    customInflationValue,
    customNbpValue,
    rateContext,
    inflationReference:
      customInflationValue ?? (lagInflation !== undefined ? lagInflation : activeExpectedInflation),
    nbpReference: customNbpValue ?? (lagNbp !== undefined ? lagNbp : expectedNbpRate),
  };
}
