import { Decimal } from 'decimal.js';

export interface RolloverResult {
  nextCycleInitialInvestment: Decimal;
  leftoverCash: Decimal;
  numberOfBonds: Decimal;
}

/**
 * Calculates the next cycle's starting parameters.
 * 
 * @param totalAvailable Cash available for reinvestment
 * @param bondPrice Price per bond (including potential rebuy discount)
 * @param nominalValue Face value of a single bond
 */
export function calculateRollover(
  totalAvailable: Decimal,
  bondPrice: Decimal,
): RolloverResult {
  const numberOfBonds = totalAvailable.dividedBy(bondPrice).floor();
  const nextCycleInitialInvestment = numberOfBonds.times(bondPrice);
  const leftoverCash = totalAvailable.minus(nextCycleInitialInvestment);

  return {
    nextCycleInitialInvestment,
    leftoverCash,
    numberOfBonds
  };
}
