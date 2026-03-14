import { 
  BondInputs, 
  BondType, 
  CalculationResult, 
  YearlyTimelinePoint, 
  InterestPayout,
  RegularInvestmentInputs,
  RegularInvestmentResult,
  InvestmentFrequency,
  RegularTimelinePoint,
  LotBreakdown
} from '../types';
import { addMonths, addYears, differenceInDays, differenceInMonths, isAfter, isBefore, parseISO, min, format } from 'date-fns';

/**
 * Standard calculation for a single bond investment.
 * Handles different bond types, inflation indexing, capitalization, and taxes.
 * Precise date-based logic for early withdrawal.
 */
export function calculateBondInvestment(inputs: BondInputs): CalculationResult {
  const {
    initialInvestment,
    firstYearRate,
    expectedInflation,
    margin,
    duration,
    earlyWithdrawalFee,
    taxRate,
    bondType,
    isCapitalized,
    purchaseDate,
    withdrawalDate
  } = inputs;

  const startDate = parseISO(purchaseDate);
  const targetWithdrawalDate = parseISO(withdrawalDate);
  const maturityDate = addMonths(startDate, Math.round(duration * 12));
  
  // Real withdrawal date is either maturity or user-selected withdrawal date
  const actualWithdrawalDate = min([targetWithdrawalDate, maturityDate]);
  const isEarlyWithdrawal = isBefore(actualWithdrawalDate, maturityDate);

  const timeline: YearlyTimelinePoint[] = [];
  
  // Bond units are 100 PLN.
  const numberOfBonds = Math.floor(initialInvestment / 100);
  const actualInitialInvestment = numberOfBonds * 100;

  let currentNominalValue = actualInitialInvestment;
  let cumulativeInflation = 1;
  let totalInterestEarnedSoFar = 0;
  let totalTaxPaidSoFar = 0;

  // We calculate year by year up to the bond's maturity OR withdrawal
  const totalMonthsHeld = differenceInMonths(actualWithdrawalDate, startDate);
  const yearsHeld = Math.ceil(totalMonthsHeld / 12);
  const maxYears = Math.ceil(duration);

  for (let year = 1; year <= maxYears; year++) {
    const yearStartDate = addYears(startDate, year - 1);
    const yearEndDate = addYears(startDate, year);
    
    // If this year starts after withdrawal, skip
    if (isAfter(yearStartDate, actualWithdrawalDate) && year > 1) break;

    // Check if we are in a partial year due to withdrawal
    const isWithdrawalYear = isBefore(actualWithdrawalDate, yearEndDate) || actualWithdrawalDate.getTime() === yearEndDate.getTime();
    const periodEndDate = min([yearEndDate, actualWithdrawalDate]);
    
    // Calculate fractional year if needed
    const daysInYear = differenceInDays(yearEndDate, yearStartDate);
    const daysHeldInPeriod = differenceInDays(periodEndDate, yearStartDate);
    const timeFactor = daysHeldInPeriod / daysInYear;

    if (timeFactor <= 0 && year > 1) break;

    const isFirstYear = year === 1;
    let currentInterestRate = isFirstYear ? firstYearRate : (expectedInflation + margin);
    
    // Fixed rate logic (TOS, OTS)
    if (bondType === BondType.OTS || bondType === BondType.TOS) {
      currentInterestRate = firstYearRate;
    }
    
    // NBP Reference rate logic (ROR, DOR) - Simplified to use firstYearRate for now
    if (bondType === BondType.ROR || bondType === BondType.DOR) {
      currentInterestRate = firstYearRate; 
    }

    // Interest earned in this period
    const interestEarned = currentNominalValue * (currentInterestRate / 100) * (bondType === BondType.OTS ? (3/12) : timeFactor);
    const taxDeducted = interestEarned * (taxRate / 100);
    const netInterest = interestEarned - taxDeducted;

    const previousNominalValue = currentNominalValue;
    
    if (isCapitalized) {
      currentNominalValue += interestEarned;
      totalInterestEarnedSoFar += interestEarned;
    } else {
      totalInterestEarnedSoFar += interestEarned;
      totalTaxPaidSoFar += taxDeducted;
    }
    
    // Inflation adjustment
    const annualInflation = Math.max(-0.99, expectedInflation / 100);
    cumulativeInflation *= (1 + annualInflation * timeFactor);
    const realValue = currentNominalValue / cumulativeInflation;

    // Early withdrawal fee calculation
    let currentWithdrawalFee = 0;
    if (isEarlyWithdrawal || isWithdrawalYear) {
      if (bondType === BondType.OTS) {
        currentWithdrawalFee = interestEarned; // For OTS, early exit often means losing all interest
      } else {
        const totalMaxFee = numberOfBonds * earlyWithdrawalFee;
        currentWithdrawalFee = Math.min(totalInterestEarnedSoFar, totalMaxFee);
      }
    }

    const isMaturity = periodEndDate.getTime() === maturityDate.getTime();
    const isWithdrawal = periodEndDate.getTime() === actualWithdrawalDate.getTime();

    timeline.push({
      year,
      periodLabel: isMaturity ? 'Maturity' : `Year ${year}`,
      interestRate: currentInterestRate,
      nominalValueBeforeInterest: previousNominalValue,
      interestEarned,
      taxDeducted,
      netInterest,
      nominalValueAfterInterest: currentNominalValue,
      realValue,
      netProfit: (isCapitalized ? (currentNominalValue - (totalInterestEarnedSoFar * (taxRate / 100))) : (currentNominalValue + (totalInterestEarnedSoFar - totalTaxPaidSoFar))) - actualInitialInvestment - (isWithdrawal ? currentWithdrawalFee : 0),
      earlyWithdrawalValue: Math.max(actualInitialInvestment, currentNominalValue - (isCapitalized ? (totalInterestEarnedSoFar * (taxRate / 100)) : 0) - currentWithdrawalFee),
      cumulativeInflation,
      isMaturity,
      isWithdrawal
    });

    if (isWithdrawal) break;
  }

  const lastPoint = timeline[timeline.length - 1];
  const totalEarlyWithdrawalFee = isEarlyWithdrawal ? Math.min(totalInterestEarnedSoFar, numberOfBonds * earlyWithdrawalFee) : 0;
  
  const grossValue = lastPoint.nominalValueAfterInterest;
  const totalTax = isCapitalized ? (totalInterestEarnedSoFar * (taxRate / 100)) : totalTaxPaidSoFar;
  const netPayoutValue = grossValue - (isCapitalized ? totalTax : 0) - totalEarlyWithdrawalFee;

  return {
    timeline,
    finalNominalValue: grossValue,
    finalRealValue: lastPoint.realValue,
    totalProfit: netPayoutValue - actualInitialInvestment,
    totalTax,
    totalEarlyWithdrawalFee,
    grossValue,
    netPayoutValue,
    isEarlyWithdrawal,
    maturityDate: maturityDate.toISOString()
  };
}

/**
 * Regular investment calculator.
 * Tracks multiple "lots" of bonds bought at different times.
 */
export function calculateRegularInvestment(inputs: RegularInvestmentInputs): RegularInvestmentResult {
  const {
    contributionAmount,
    frequency,
    totalHorizon,
    bondType,
    firstYearRate,
    expectedInflation,
    margin,
    earlyWithdrawalFee,
    taxRate,
    isCapitalized,
    purchaseDate,
    withdrawalDate
  } = inputs;

  const startPurchaseDate = parseISO(purchaseDate);
  const targetWithdrawalDate = parseISO(withdrawalDate);
  
  const totalMonths = totalHorizon * 12;
  const interval = frequency === InvestmentFrequency.MONTHLY ? 1 : 
                   frequency === InvestmentFrequency.QUARTERLY ? 3 : 12;

  const lots: LotBreakdown[] = [];
  const timeline: RegularTimelinePoint[] = [];
  
  let totalInvested = 0;
  let cumulativeInflation = 1;
  const monthlyInflation = expectedInflation / 12 / 100;

  // Simulate month by month
  for (let m = 0; m <= totalMonths; m++) {
    const currentMonthDate = addMonths(startPurchaseDate, m);
    
    // Stop if we reached target withdrawal date
    if (isAfter(currentMonthDate, targetWithdrawalDate)) break;

    // 1. Add new contribution
    if (m % interval === 0 && m < totalMonths) {
      const units = Math.floor(contributionAmount / 100);
      const amount = units * 100;
      if (amount > 0) {
        const lotMaturityDate = addMonths(currentMonthDate, Math.round((bondType === BondType.OTS ? 0.25 : inputs.duration) * 12));
        lots.push({
          purchaseDate: currentMonthDate.toISOString(),
          maturityDate: lotMaturityDate.toISOString(),
          isMatured: false,
          investedAmount: amount,
          accumulatedInterest: 0,
          tax: 0,
          earlyWithdrawalFee: 0,
          grossValue: amount,
          netValue: amount
        });
        totalInvested += amount;
      }
    }

    // 2. Accrue interest and update lots
    lots.forEach(lot => {
      const lotPurchaseDate = parseISO(lot.purchaseDate);
      const lotMaturityDate = parseISO(lot.maturityDate);
      
      if (isAfter(currentMonthDate, lotPurchaseDate)) {
        const monthsHeld = differenceInMonths(currentMonthDate, lotPurchaseDate);
        const bondDurationMonths = Math.round((bondType === BondType.OTS ? 0.25 : inputs.duration) * 12);
        
        if (monthsHeld <= bondDurationMonths) {
          const isFirstYear = monthsHeld <= 12;
          const currentAnnualRate = isFirstYear ? firstYearRate : (expectedInflation + margin);
          const monthlyRate = currentAnnualRate / 12 / 100;
          
          const interestThisMonth = lot.grossValue * monthlyRate;
          const taxThisMonth = interestThisMonth * (taxRate / 100);
          
          lot.accumulatedInterest += interestThisMonth;
          if (isCapitalized) {
            lot.grossValue += interestThisMonth;
          } else {
            lot.tax += taxThisMonth;
          }
        }
        
        lot.isMatured = !isBefore(currentMonthDate, lotMaturityDate);
        
        // Calculate early withdrawal fee if it were withdrawn NOW
        if (!lot.isMatured) {
          if (bondType === BondType.OTS) {
            lot.earlyWithdrawalFee = lot.accumulatedInterest;
          } else {
            const units = lot.investedAmount / 100;
            lot.earlyWithdrawalFee = Math.min(lot.accumulatedInterest, units * earlyWithdrawalFee);
          }
        } else {
          lot.earlyWithdrawalFee = 0;
        }

        const taxOnExit = isCapitalized ? (lot.accumulatedInterest * (taxRate / 100)) : lot.tax;
        lot.netValue = lot.grossValue - (isCapitalized ? taxOnExit : 0) - lot.earlyWithdrawalFee;
      }
    });

    // 3. Update inflation
    if (m > 0) {
      cumulativeInflation *= (1 + monthlyInflation);
    }

    // 4. Timeline point
    let currentNominalValue = 0;
    let currentProfit = 0;
    let currentTax = 0;
    let currentFees = 0;

    lots.forEach(lot => {
      currentNominalValue += lot.grossValue;
      currentProfit += (lot.netValue - lot.investedAmount);
      currentTax += (isCapitalized ? (lot.accumulatedInterest * (taxRate / 100)) : lot.tax);
      currentFees += lot.earlyWithdrawalFee;
    });

    if (m % 3 === 0 || m === totalMonths || currentMonthDate.getTime() === targetWithdrawalDate.getTime()) {
      timeline.push({
        month: m,
        date: currentMonthDate.toISOString(),
        totalInvested,
        nominalValue: currentNominalValue,
        realValue: currentNominalValue / cumulativeInflation,
        profit: currentProfit,
        tax: currentTax,
        earlyWithdrawalFees: currentFees
      });
    }

    if (currentMonthDate.getTime() === targetWithdrawalDate.getTime()) break;
  }

  const lastPoint = timeline[timeline.length - 1];

  return {
    totalInvested,
    finalNominalValue: lastPoint.nominalValue,
    finalRealValue: lastPoint.realValue,
    totalProfit: lastPoint.profit,
    totalTax: lastPoint.tax,
    totalEarlyWithdrawalFees: lastPoint.earlyWithdrawalFees,
    timeline,
    lots
  };
}
