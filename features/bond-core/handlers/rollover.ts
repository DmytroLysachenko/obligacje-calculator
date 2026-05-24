import { BondInputs } from '../types';
import { getHorizonMonths } from '@/shared/lib/date-timing';

export function shouldAutoRollover(inputs: BondInputs, durationYears: number) {
  const nativeDurationMonths = Math.max(1, Math.round(durationYears * 12));
  const horizonMonths =
    inputs.investmentHorizonMonths
    ?? getHorizonMonths(inputs.purchaseDate, inputs.withdrawalDate);

  return horizonMonths > nativeDurationMonths;
}

