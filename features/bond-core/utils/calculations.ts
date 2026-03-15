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
import { BOND_DEFINITIONS } from '../constants/bond-definitions';
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
    expectedNbpRate = 5.25, // Default if not provided
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

  const bondDef = BOND_DEFINITIONS[bondType];
  const isInflationIndexed = bondDef?.isInflationIndexed ?? false;

  const startDate = parseISO(purchaseDate);
  const targetWithdrawalDate = parseISO(withdrawalDate);
  const maturityDate = addMonths(startDate, Math.round(duration * 12));
  
  const actualWithdrawalDate = min([targetWithdrawalDate, maturityDate]);
  const isEarlyWithdrawal = isBefore(actualWithdrawalDate, maturityDate);

  const timeline: YearlyTimelinePoint[] = [];
  
  const bondPrice = isRebought ? (100 - rebuyDiscount) : 100;
  const numberOfBonds = Math.floor(initialInvestment / bondPrice);
  const actualInitialInvestment = numberOfBonds * bondPrice;
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
    
    if (isAfter(periodStartDate, actualWithdrawalDate) && period > 1) break;

    const isWithdrawalPeriod = isBefore(actualWithdrawalDate, periodEndDateNorm) || actualWithdrawalDate.getTime() === periodEndDateNorm.getTime();
    const periodEndDate = min([periodEndDateNorm, actualWithdrawalDate]);
    
    const daysInPeriod = differenceInDays(periodEndDateNorm, periodStartDate);
    const daysHeldInPeriod = differenceInDays(periodEndDate, periodStartDate);
    const timeFactor = daysInPeriod > 0 ? (daysHeldInPeriod / daysInPeriod) : 1;

    if (timeFactor <= 0 && period > 1) break;

    const isFirstPeriod = period === 1;
    let currentInterestRate = 0;

    // 1. Determine annual interest rate for this period
    if (bondType === BondType.OTS || bondType === BondType.TOS) {
      currentInterestRate = firstYearRate;
    } else if (bondType === BondType.ROR || bondType === BondType.DOR) {
      currentInterestRate = isFirstPeriod ? firstYearRate : (Math.max(0, expectedNbpRate) + margin);
    } else if (isInflationIndexed) {
      currentInterestRate = isFirstPeriod ? firstYearRate : (Math.max(0, expectedInflation) + margin);
    } else {
      currentInterestRate = firstYearRate;
    }

    // 2. Calculate interest for this period
    // For OTS, it's a special 3-month fixed rate.
    let interestEarned = 0;
    if (bondType === BondType.OTS) {
      // OTS is exactly 3 months, fixed rate applies to the whole period.
      // If early withdrawal, they usually lose all interest.
      interestEarned = nominalStartingValue * (currentInterestRate / 100) * (3 / 12);
      if (isEarlyWithdrawal) interestEarned = 0; // Simplified OTS early exit
    } else {
      const annualRate = currentInterestRate / 100;
      if (isMonthly) {
        interestEarned = currentNominalValue * (annualRate / 12) * timeFactor;
      } else {
        interestEarned = currentNominalValue * annualRate * timeFactor;
      }
    }

    const previousNominalValue = currentNominalValue;
    totalInterestEarnedSoFar += interestEarned;

    let taxDeducted = 0;
    if (!isCapitalized) {
      // For ROR, DOR, COI tax is deducted from each payout
      taxDeducted = interestEarned * (taxRate / 100);
      totalTaxPaidSoFar += taxDeducted;
    } else {
      // For EDO, TOS, ROS, ROD tax is deferred until the end
      currentNominalValue += interestEarned;
    }
    
    const netInterest = interestEarned - taxDeducted;

    // 3. Inflation adjustment
    const annualInflation = Math.max(-0.99, expectedInflation / 100);
    const periodInflation = isMonthly ? annualInflation / 12 : annualInflation;
    cumulativeInflation *= (1 + periodInflation * timeFactor);
    const realValue = (isCapitalized ? currentNominalValue : nominalStartingValue) / cumulativeInflation;

    // 4. Early withdrawal fee
    let currentWithdrawalFee = 0;
    if (isEarlyWithdrawal || isWithdrawalPeriod) {
      if (bondType !== BondType.OTS) {
        const totalMaxFee = numberOfBonds * earlyWithdrawalFee;
        // Fee cannot exceed total interest earned (investor never gets less than nominal)
        currentWithdrawalFee = Math.min(totalInterestEarnedSoFar, totalMaxFee);
      }
    }

    const isMaturity = periodEndDate.getTime() === maturityDate.getTime();
    const isWithdrawal = periodEndDate.getTime() === actualWithdrawalDate.getTime();

    // 5. Calculate profit and early withdrawal value
    let netProfit = 0;
    let earlyWithdrawalValue = 0;

    if (isCapitalized) {
      const currentGrossProfit = currentNominalValue - nominalStartingValue;
      // Tax is calculated on profit after fee if withdrawn now
      const profitAfterFee = Math.max(0, currentGrossProfit - currentWithdrawalFee);
      const taxOnWithdrawal = profitAfterFee * (taxRate / 100);
      
      netProfit = (currentNominalValue - currentWithdrawalFee - taxOnWithdrawal) - actualInitialInvestment;
      earlyWithdrawalValue = currentNominalValue - currentWithdrawalFee - taxOnWithdrawal;
    } else {
      const currentGrossProfit = totalInterestEarnedSoFar;
      // For non-capitalized, some tax might have been paid already.
      // This is complex because payouts happen periodically.
      // Official rule: tax is on interest, and fee is separate deduction.
      // However, for early redemption, the fee can reduce the taxable base of the FINAL interest period or be a separate cost.
      // Guide says: W_net = W_fee - (W_fee - N) * 0.19.
      // So let's follow the guide: (Gross Value - Fee - Nominal) is the taxable base.
      const grossValueNow = nominalStartingValue + totalInterestEarnedSoFar;
      const taxableBase = Math.max(0, grossValueNow - currentWithdrawalFee - nominalStartingValue);
      const totalTaxForThisExit = taxableBase * (taxRate / 100);

      netProfit = (grossValueNow - currentWithdrawalFee - totalTaxForThisExit) - actualInitialInvestment;
      earlyWithdrawalValue = grossValueNow - currentWithdrawalFee - totalTaxForThisExit;
    }

    timeline.push({
      year: isMonthly ? Math.ceil(period / 12) : period,
      periodLabel: isMaturity ? 'Maturity' : (isMonthly ? `Month ${period}` : `Year ${period}`),
      interestRate: currentInterestRate,
      nominalValueBeforeInterest: previousNominalValue,
      interestEarned,
      taxDeducted,
      netInterest,
      nominalValueAfterInterest: isCapitalized ? currentNominalValue : nominalStartingValue,
      realValue,
      netProfit,
      earlyWithdrawalValue: Math.max(actualInitialInvestment, earlyWithdrawalValue),
      cumulativeInflation,
      isMaturity,
      isWithdrawal
    });

    if (isWithdrawal) break;
  }

  const lastPoint = timeline[timeline.length - 1];
  const totalGrossInterest = totalInterestEarnedSoFar;
  const totalEarlyWithdrawalFee = isEarlyWithdrawal ? Math.min(totalInterestEarnedSoFar, numberOfBonds * earlyWithdrawalFee) : 0;
  
  // Tax is on profit after early withdrawal fee
  const taxableProfit = Math.max(0, totalGrossInterest - totalEarlyWithdrawalFee);
  const totalTax = taxableProfit * (taxRate / 100);
  
  const grossValueAtEnd = (isCapitalized ? currentNominalValue : nominalStartingValue + totalGrossInterest);
  const netPayoutValue = grossValueAtEnd - totalEarlyWithdrawalFee - totalTax;

  return {
    initialInvestment: actualInitialInvestment,
    timeline,
    finalNominalValue: isCapitalized ? currentNominalValue : nominalStartingValue,
    finalRealValue: lastPoint.realValue,
    totalProfit: netPayoutValue - actualInitialInvestment,
    totalTax,
    totalEarlyWithdrawalFee,
    grossValue: grossValueAtEnd,
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
    expectedNbpRate,
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
    
    if (isAfter(currentMonthDate, targetWithdrawalDate)) break;

    // 1. Add new contribution
    if (m % interval === 0 && m < totalMonths) {
      const units = Math.floor(contributionAmount / bondPrice);
      const investedAmount = units * bondPrice;
      const nominalAmount = units * 100;
      
      if (units > 0) {
        const lotDuration = bondType === BondType.OTS ? 0.25 : inputs.duration;
        const lotMaturityDate = addMonths(currentMonthDate, Math.round(lotDuration * 12));
        lots.push({
          purchaseDate: currentMonthDate.toISOString(),
          maturityDate: lotMaturityDate.toISOString(),
          isMatured: false,
          investedAmount: investedAmount,
          accumulatedInterest: 0,
          tax: 0,
          earlyWithdrawalFee: 0,
          grossValue: nominalAmount,
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
        const lotDuration = bondType === BondType.OTS ? 0.25 : inputs.duration;
        const bondDurationMonths = Math.round(lotDuration * 12);
        
        if (monthsHeld <= bondDurationMonths) {
          const isFirstYear = monthsHeld < 12;
          let currentAnnualRate = 0;

          if (bondType === BondType.OTS || bondType === BondType.TOS) {
            currentAnnualRate = firstYearRate;
          } else if (bondType === BondType.ROR || bondType === BondType.DOR) {
            currentAnnualRate = isFirstYear ? firstYearRate : (Math.max(0, expectedNbpRate ?? 5.25) + margin);
          } else {
            // Inflation indexed
            currentAnnualRate = isFirstYear ? firstYearRate : (Math.max(0, expectedInflation) + margin);
          }

          const monthlyRate = currentAnnualRate / 12 / 100;
          const interestThisMonth = lot.grossValue * monthlyRate;
          
          lot.accumulatedInterest += interestThisMonth;
          if (isCapitalized) {
            lot.grossValue += interestThisMonth;
          } else {
            const taxThisMonth = interestThisMonth * (taxRate / 100);
            lot.tax += taxThisMonth;
          }
        }
        
        lot.isMatured = !isBefore(currentMonthDate, lotMaturityDate);
        
        if (!lot.isMatured) {
          if (bondType === BondType.OTS) {
            lot.earlyWithdrawalFee = lot.accumulatedInterest;
          } else {
            const units = Math.floor(lot.investedAmount / bondPrice);
            lot.earlyWithdrawalFee = Math.min(lot.accumulatedInterest, units * earlyWithdrawalFee);
          }
        } else {
          lot.earlyWithdrawalFee = 0;
        }

        const currentGrossProfit = lot.accumulatedInterest;
        const taxableProfit = Math.max(0, currentGrossProfit - lot.earlyWithdrawalFee);
        const deferredTax = isCapitalized ? (taxableProfit * (taxRate / 100)) : 0;
        
        const currentGrossValue = isCapitalized ? lot.grossValue : (Math.floor(lot.investedAmount / bondPrice) * 100 + lot.accumulatedInterest);
        // If not capitalized, lot.tax was already deducted from interest each month.
        // We might need to adjust it if fee reduces taxable base, but for monthly payouts it's harder.
        // Usually, for ROR/DOR, tax is already paid, so fee is just a separate cost.
        // Let's stick to capitalized for now for this specific adjustment.
        lot.netValue = currentGrossValue - (isCapitalized ? deferredTax : lot.tax) - lot.earlyWithdrawalFee;
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
      const nominalStarting = Math.floor(lot.investedAmount / bondPrice) * 100;
      currentNominalValue += isCapitalized ? lot.grossValue : nominalStarting;
      currentProfit += (lot.netValue - lot.investedAmount);
      
      const currentGrossProfit = lot.accumulatedInterest;
      const taxableProfit = Math.max(0, currentGrossProfit - lot.earlyWithdrawalFee);
      currentTax += (isCapitalized ? (taxableProfit * (taxRate / 100)) : lot.tax);
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
