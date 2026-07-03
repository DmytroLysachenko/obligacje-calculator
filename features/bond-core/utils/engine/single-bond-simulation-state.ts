import { Decimal } from 'decimal.js';

import { YearlyTimelinePoint } from '../../types';

import { applySingleBondTaxRelief } from './single-bond-tax-relief';

type SingleBondTaxRelief = ReturnType<typeof applySingleBondTaxRelief>;

export interface SingleBondSimulationState {
  currentInitialInvestment: Decimal;
  calculationNotes: string[];
  leftoverCash: Decimal;
  globalTimeline: YearlyTimelinePoint[];
  totalTaxAcc: Decimal;
  totalFeeAcc: Decimal;
  globalAccumulatedNetInterest: Decimal;
  currentPurchaseDate: Date;
  applySwapDiscountThisCycle: boolean;
  cycleIndex: number;
  dataQualityFlags: Set<string>;
}

export function createSingleBondSimulationState({
  taxRelief,
  startDate,
}: {
  taxRelief: SingleBondTaxRelief;
  startDate: Date;
}): SingleBondSimulationState {
  return {
    currentInitialInvestment: taxRelief.currentInitialInvestment,
    calculationNotes: [...taxRelief.calculationNotes],
    leftoverCash: new Decimal(0),
    globalTimeline: [],
    totalTaxAcc: new Decimal(0),
    totalFeeAcc: new Decimal(0),
    globalAccumulatedNetInterest: new Decimal(0),
    currentPurchaseDate: startDate,
    applySwapDiscountThisCycle: false,
    cycleIndex: 1,
    dataQualityFlags: new Set<string>(),
  };
}
