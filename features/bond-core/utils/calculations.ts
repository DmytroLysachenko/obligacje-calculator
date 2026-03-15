import { 
  BondInputs, 
  BondType, 
  CalculationResult, 
  YearlyTimelinePoint, 
  RegularInvestmentInputs,
  RegularInvestmentResult,
  InvestmentFrequency,
  RegularTimelinePoint,
  LotBreakdown,
  InterestPayout
} from '../types';
import { addMonths, addYears, differenceInDays, differenceInMonths, isAfter, isBefore, parseISO, min } from 'date-fns';

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
    payoutFrequency,
    purchaseDate,
    withdrawalDate,
    isRebought,
    rebuyDiscount
  } = inputs;

  const startDate = parseISO(purchaseDate);
  const targetWithdrawalDate = parseISO(withdrawalDate);
  const maturityDate = addMonths(startDate, Math.round(duration * 12));
  
  // Real withdrawal date is either maturity or user-selected withdrawal date
  const actualWithdrawalDate = min([targetWithdrawalDate, maturityDate]);
  const isEarlyWithdrawal = isBefore(actualWithdrawalDate, maturityDate);

  const timeline: YearlyTimelinePoint[] = [];
  
  const bondPrice = isRebought ? (100 - rebuyDiscount) : 100;
  const numberOfBonds = Math.floor(initialInvestment / bondPrice);
  const actualInitialInvestment = numberOfBonds * bondPrice;
  // Interest is calculated on the nominal value (always 100 PLN per bond)
  const nominalStartingValue = numberOfBonds * 100;

  let currentNominalValue = nominalStartingValue;
  let cumulativeInflation = 1;
  let totalInterestEarnedSoFar = 0;
  let totalTaxPaidSoFar = 0;

  const isMonthly = payoutFrequency === InterestPayout.MONTHLY;
  const periods = isMonthly ? Math.round(duration * 12) : Math.ceil(duration);
  const addPeriod = isMonthly ? addMonths : addYears;

  for (let period = 1; period <= periods; period++) {
    const periodStartDate = addPeriod(startDate, period - 1);
    const periodEndDateNorm = addPeriod(startDate, period);
    
    // If this period starts after withdrawal, skip
    if (isAfter(periodStartDate, actualWithdrawalDate) && period > 1) break;

    // Check if we are in a partial period due to withdrawal
    const isWithdrawalPeriod = isBefore(actualWithdrawalDate, periodEndDateNorm) || actualWithdrawalDate.getTime() === periodEndDateNorm.getTime();
    const periodEndDate = min([periodEndDateNorm, actualWithdrawalDate]);
    
    // Calculate fractional period if needed
    const daysInPeriod = differenceInDays(periodEndDateNorm, periodStartDate);
    const daysHeldInPeriod = differenceInDays(periodEndDate, periodStartDate);
    const timeFactor = daysHeldInPeriod / daysInPeriod;

    if (timeFactor <= 0 && period > 1) break;

    const isFirstYear = isMonthly ? period <= 12 : period === 1;
    let currentInterestRate = isFirstYear ? firstYearRate : (Math.max(0, expectedInflation) + margin);
    
    // Fixed rate logic (TOS, OTS)
    if (bondType === BondType.OTS || bondType === BondType.TOS) {
      currentInterestRate = firstYearRate;
    }
    
    // NBP Reference rate logic (ROR, DOR)
    if (bondType === BondType.ROR || bondType === BondType.DOR) {
      currentInterestRate = firstYearRate; 
    }

    // Interest earned in this period
    const periodRate = isMonthly ? currentInterestRate / 12 : currentInterestRate;
    const interestEarned = currentNominalValue * (periodRate / 100) * (bondType === BondType.OTS ? (3/12) : timeFactor);
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
    const periodInflation = isMonthly ? annualInflation / 12 : annualInflation;
    cumulativeInflation *= (1 + periodInflation * timeFactor);
    const realValue = currentNominalValue / cumulativeInflation;

    // Early withdrawal fee calculation
    let currentWithdrawalFee = 0;
    if (isEarlyWithdrawal || isWithdrawalPeriod) {
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
      year: isMonthly ? Math.ceil(period / 12) : period, // year field kept for compatibility
      periodLabel: isMaturity ? 'Maturity' : (isMonthly ? `Month ${period}` : `Year ${period}`),
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
  
  // For non-capitalized bonds, currentNominalValue remains at the starting principal.
  // We need to add the earned interest to get the total gross value.
  const finalPrincipal = lastPoint.nominalValueAfterInterest;
  const totalGrossInterest = totalInterestEarnedSoFar;
  const grossValue = finalPrincipal + (isCapitalized ? 0 : totalGrossInterest);
  
  const totalTax = isCapitalized ? (totalGrossInterest * (taxRate / 100)) : totalTaxPaidSoFar;
  const netPayoutValue = grossValue - totalTax - totalEarlyWithdrawalFee;

  return {
    initialInvestment: actualInitialInvestment,
    timeline,
    finalNominalValue: finalPrincipal,
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
    withdrawalDate,
    isRebought,
    rebuyDiscount
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
  const bondPrice = isRebought ? (100 - rebuyDiscount) : 100;

  // Simulate month by month
  for (let m = 0; m <= totalMonths; m++) {
    const currentMonthDate = addMonths(startPurchaseDate, m);
    
    // Stop if we reached target withdrawal date
    if (isAfter(currentMonthDate, targetWithdrawalDate)) break;

    // 1. Add new contribution
    if (m % interval === 0 && m < totalMonths) {
      const units = Math.floor(contributionAmount / bondPrice);
      const investedAmount = units * bondPrice;
      const nominalAmount = units * 100;
      
      if (units > 0) {
        const lotMaturityDate = addMonths(currentMonthDate, Math.round((bondType === BondType.OTS ? 0.25 : inputs.duration) * 12));
        lots.push({
          purchaseDate: currentMonthDate.toISOString(),
          maturityDate: lotMaturityDate.toISOString(),
          isMatured: false,
          investedAmount: investedAmount,
          accumulatedInterest: 0,
          tax: 0,
          earlyWithdrawalFee: 0,
          grossValue: nominalAmount, // start with nominal amount for interest calc
          netValue: nominalAmount
        });
        totalInvested += investedAmount;
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
          const currentAnnualRate = isFirstYear ? firstYearRate : (Math.max(0, expectedInflation) + margin);
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
