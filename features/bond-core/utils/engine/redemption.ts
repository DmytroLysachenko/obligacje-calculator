import { Decimal } from 'decimal.js';

import { BondType } from '../../types';

export function calculateEarlyWithdrawalFee(
  bondType: BondType,
  isEarlyWithdrawal: boolean,
  isWithdrawalPeriod: boolean,
  totalInterestEarnedSoFar: Decimal,
  numberOfBonds: Decimal,
  earlyWithdrawalFee: number,
  capBasis: 'interest' | 'principal' = 'interest',
): Decimal {
  if (!isEarlyWithdrawal && !isWithdrawalPeriod) return new Decimal(0);

  if (bondType === BondType.OTS) {
    // OTS exit loses all interest
    return totalInterestEarnedSoFar;
  }

  const totalMaxFee = numberOfBonds.times(earlyWithdrawalFee);
  // Some issued terms cap the fee at current interest; later ROR/DOR terms
  // can expressly permit collection from principal. This is an issued-rule
  // input, never a family-wide inference.
  return capBasis === 'principal'
    ? totalMaxFee
    : Decimal.min(totalInterestEarnedSoFar, totalMaxFee);
}
