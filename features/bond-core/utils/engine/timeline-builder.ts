import { 
  addMonths, 
  addYears, 
  addDays,
  addQuarters,
  differenceInDays, 
  isAfter, 
  isBefore,
  min, 
  format 
} from 'date-fns';
import { InterestPayout, ChartStep } from '../../types';

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
 * If chartStep is provided, it generates more granular points for charting.
 */
export function generateCyclePeriods(
  currentPurchaseDate: Date,
  cycleMaturityDate: Date,
  actualCycleEndDate: Date,
  payoutFrequency: InterestPayout,
  bondDuration: number,
  chartStep?: ChartStep
): TimelinePeriod[] {
  const isMonthlyPayout = payoutFrequency === InterestPayout.MONTHLY;
  
  // Determine the natural step for the bond (payout based)
  const payoutStepFn = isMonthlyPayout ? addMonths : addYears;

  // If chartStep is provided we use it, otherwise fallback to payout frequency
  let stepFn = payoutStepFn;
  if (chartStep === 'daily') stepFn = addDays;
  else if (chartStep === 'monthly') stepFn = addMonths;
  else if (chartStep === 'quarterly') stepFn = addQuarters;
  else if (chartStep === 'yearly') stepFn = addYears;

  const periods: TimelinePeriod[] = [];
  let currentPeriodStart = currentPurchaseDate;

  // Safety counter to prevent infinite loops
  let safety = 0;
  while (isBefore(currentPeriodStart, actualCycleEndDate) && safety < 1000) {
    safety++;
    const nextStepDate = stepFn(currentPeriodStart, 1);
    
    const periodEndDate = min([nextStepDate, actualCycleEndDate]);
    const isMaturity = periodEndDate.getTime() === cycleMaturityDate.getTime();
    const isWithdrawal = periodEndDate.getTime() === actualCycleEndDate.getTime();

    periods.push({
      startDate: currentPeriodStart,
      endDate: periodEndDate,
      daysInPeriod: differenceInDays(nextStepDate, currentPeriodStart),
      daysHeld: differenceInDays(periodEndDate, currentPeriodStart),
      isMaturity,
      isWithdrawal,
      periodLabel: format(periodEndDate, chartStep === 'daily' ? 'dd MMM yyyy' : 'MMM yyyy')
    });

    if (isWithdrawal) break;
    currentPeriodStart = periodEndDate;
  }

  return periods;
}
