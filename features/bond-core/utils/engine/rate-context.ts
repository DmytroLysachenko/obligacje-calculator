import { Decimal } from 'decimal.js';
import { BondType, RateSource } from '../../types';
import { determineInterestRate } from './rate-resolution';

export interface SingleBondRateContextInput {
  bondType: BondType;
  monthsIntoCycle: number;
  firstYearRate: number;
  activeExpectedInflation: number;
  expectedNbpRate: number;
  margin: number;
  isInflationIndexed: boolean;
  lagInflation?: number;
  lagNbp?: number;
  customInflationValue?: number;
  customNbpValue?: number;
  isInflationProjected: boolean;
  isNbpProjected: boolean;
}

export interface SingleBondRateContext {
  currentInterestRate: Decimal;
  rateSource: RateSource;
  rateReferenceValue?: number;
  rateMarginApplied: number;
  usedProjectedRate: boolean;
  shouldRecordRateReset: boolean;
  rateResetDescription: string | null;
}

export function resolveSingleBondRateContext({
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
}: SingleBondRateContextInput): SingleBondRateContext {
  const currentInterestRate = determineInterestRate(
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
  );
  let rateSource: RateSource = 'fixed_rate';
  let rateReferenceValue: number | undefined;
  let rateMarginApplied = margin;
  let usedProjectedRate = false;
  let shouldRecordRateReset = false;
  let rateResetDescription: string | null = null;

  if (bondType === BondType.ROR || bondType === BondType.DOR) {
    const isFirstMonth = monthsIntoCycle === 0;

    if (isFirstMonth) {
      rateSource = 'first_year_fixed';
      rateReferenceValue = firstYearRate;
      rateMarginApplied = 0;
    } else {
      usedProjectedRate = customNbpValue !== undefined || isNbpProjected;
      rateSource =
        customNbpValue !== undefined
          ? 'projected_nbp'
          : lagNbp !== undefined
            ? 'historical_nbp'
            : 'projected_nbp';
      rateReferenceValue = customNbpValue ?? (lagNbp !== undefined ? lagNbp : expectedNbpRate);
      shouldRecordRateReset = true;
      rateResetDescription = `Rate reset based on NBP: ${currentInterestRate.toFixed(2)}%`;
    }
  } else if (isInflationIndexed) {
    const isFirstYear = monthsIntoCycle < 12;

    if (isFirstYear) {
      rateSource = 'first_year_fixed';
      rateReferenceValue = firstYearRate;
      rateMarginApplied = 0;
    } else if (monthsIntoCycle % 12 === 0) {
      usedProjectedRate = customInflationValue !== undefined || isInflationProjected;
      rateSource =
        customInflationValue !== undefined
          ? 'projected_cpi'
          : lagInflation !== undefined
            ? 'historical_cpi_lag'
            : 'projected_cpi';
      rateReferenceValue =
        customInflationValue ??
        (lagInflation !== undefined ? lagInflation : activeExpectedInflation);
      shouldRecordRateReset = true;
      rateResetDescription = `Rate reset based on Inflation: ${currentInterestRate.toFixed(2)}%`;
    }
  }

  return {
    currentInterestRate,
    rateSource,
    rateReferenceValue,
    rateMarginApplied,
    usedProjectedRate,
    shouldRecordRateReset,
    rateResetDescription,
  };
}
