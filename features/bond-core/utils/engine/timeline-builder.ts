import { 
  addMonths, 
  addYears, 
  differenceInDays, 
  isAfter, 
  min, 
  format 
} from 'date-fns';
import { InterestPayout } from '../../types';

export interface TimelinePeriod {
  startDate: Date;
  endDate: Date;
  daysInPeriod: number;
  daysHeld: number;
  isMaturity: boolean;
  isWithdrawal: boolean;
  periodLabel: string;
}

/**
 * Generates the discrete periods for a bond cycle.
 */
export function generateCyclePeriods(
  currentPurchaseDate: Date,
  cycleMaturityDate: Date,
  actualCycleEndDate: Date,
  payoutFrequency: InterestPayout,
  bondDuration: number
): TimelinePeriod[] {
  const isMonthly = payoutFrequency === InterestPayout.MONTHLY;
  const periodsCount = isMonthly ? Math.round(bondDuration * 12) : Math.ceil(bondDuration);
  const addPeriod = isMonthly ? addMonths : addYears;
  
  const periods: TimelinePeriod[] = [];

  for (let period = 1; period <= periodsCount; period++) {
    const periodStartDate = addPeriod(currentPurchaseDate, period - 1);
    const periodEndDateNorm = addPeriod(currentPurchaseDate, period);
    
    if (isAfter(periodStartDate, actualCycleEndDate) && period > 1) break;

    const periodEndDate = min([periodEndDateNorm, actualCycleEndDate]);
    
    const daysInPeriod = differenceInDays(periodEndDateNorm, periodStartDate);
    const daysHeldInPeriod = differenceInDays(periodEndDate, periodStartDate);
    
    const isMaturity = periodEndDate.getTime() === cycleMaturityDate.getTime();
    const isWithdrawal = periodEndDate.getTime() === actualCycleEndDate.getTime();

    periods.push({
      startDate: periodStartDate,
      endDate: periodEndDate,
      daysInPeriod,
      daysHeld: daysHeldInPeriod,
      isMaturity,
      isWithdrawal,
      periodLabel: format(periodEndDate, 'MMM yyyy')
    });

    if (isWithdrawal) break;
  }

  return periods;
}
