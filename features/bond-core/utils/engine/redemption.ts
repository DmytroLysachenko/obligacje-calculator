import { Decimal } from 'decimal.js';
import { BondType } from '../../types';

export function calculateEarlyWithdrawalFee(
  bondType: BondType,
  isEarlyWithdrawal: boolean,
  isWithdrawalPeriod: boolean,
  totalInterestEarnedSoFar: Decimal,
  numberOfBonds: Decimal,
  earlyWithdrawalFee: number
): Decimal {
  if (!isEarlyWithdrawal && !isWithdrawalPeriod) return new Decimal(0);
  
  if (bondType === BondType.OTS) {
    // OTS exit loses all interest
    return totalInterestEarnedSoFar;
  }
  
  const totalMaxFee = numberOfBonds.times(earlyWithdrawalFee);
  // Fee cannot exceed total interest earned
  return Decimal.min(totalInterestEarnedSoFar, totalMaxFee);
}
