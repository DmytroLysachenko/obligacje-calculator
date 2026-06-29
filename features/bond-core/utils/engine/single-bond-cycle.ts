import { addMonths, isBefore, min } from 'date-fns';
import { Decimal } from 'decimal.js';

import { calculateRollover } from './rollover';

interface SingleBondCycleDatesInput {
  purchaseDate: Date;
  bondDuration: number;
  targetWithdrawalDate: Date;
}

export function resolveSingleBondCycleDates({
  purchaseDate,
  bondDuration,
  targetWithdrawalDate,
}: SingleBondCycleDatesInput) {
  const cycleMaturityDate = addMonths(purchaseDate, Math.round(bondDuration * 12));
  const actualCycleEndDate = min([targetWithdrawalDate, cycleMaturityDate]);

  return {
    cycleMaturityDate,
    actualCycleEndDate,
    isEarlyWithdrawal: isBefore(actualCycleEndDate, cycleMaturityDate),
  };
}

interface SingleBondCycleInvestmentInput {
  availableCash: Decimal;
  nominalValue: number;
  rebuyDiscount: number;
  applySwapDiscountThisCycle: boolean;
}

export function resolveSingleBondCycleInvestment({
  availableCash,
  nominalValue,
  rebuyDiscount,
  applySwapDiscountThisCycle,
}: SingleBondCycleInvestmentInput) {
  const bondPrice = applySwapDiscountThisCycle
    ? new Decimal(nominalValue).minus(rebuyDiscount)
    : new Decimal(nominalValue);
  const rolloverParams = calculateRollover(availableCash, bondPrice);

  return {
    bondPrice,
    leftoverCash: rolloverParams.leftoverCash,
    numberOfBonds: rolloverParams.numberOfBonds,
    nominalStartingValue: rolloverParams.numberOfBonds.times(nominalValue),
  };
}

interface NextSingleBondCycleStateInput {
  netProceeds: Decimal;
  actualCycleEndDate: Date;
  isRebought: boolean;
  nextCycleIndex: number;
}

export function resolveNextSingleBondCycleState({
  netProceeds,
  actualCycleEndDate,
  isRebought,
  nextCycleIndex,
}: NextSingleBondCycleStateInput) {
  return {
    currentInitialInvestment: netProceeds,
    leftoverCash: new Decimal(0),
    globalAccumulatedNetInterest: new Decimal(0),
    currentPurchaseDate: actualCycleEndDate,
    applySwapDiscountThisCycle: isRebought,
    cycleIndex: nextCycleIndex,
  };
}
