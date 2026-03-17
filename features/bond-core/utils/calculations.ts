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
  InterestPayout,
  HistoricalDataMap,
  TaxStrategy
} from '../types';
import { BOND_DEFINITIONS } from '../constants/bond-definitions';
import { HISTORICAL_RETURNS } from '../constants/historical-data';
import { addMonths, addYears, differenceInDays, differenceInMonths, isAfter, isBefore, parseISO, min, format, subMonths } from 'date-fns';
import { Decimal } from 'decimal.js';
import { determineInterestRate } from './engine/interest-rates';
import { calculateTaxAmount } from './engine/tax-logic';
import { calculateEarlyWithdrawalFee } from './engine/redemption-engine';

/**
 * Configures Decimal for financial precision.
 */
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Helper to get historical data for a specific date with optional lag.
 */
function getHistoricalValue(
  targetDate: Date, 
  type: 'inflation' | 'nbpRate',
  lagMonths: number = 2,
  providedData?: HistoricalDataMap
): number | undefined {
  const lookbackDate = subMonths(targetDate, lagMonths);
  const key = format(lookbackDate, 'yyyy-MM');
  
  if (providedData && providedData[key]) {
    const val = providedData[key][type];
    if (val !== undefined) return val;
  }

  const record = HISTORICAL_RETURNS.find(r => r.date === key);
  if (record) {
    if (type === 'inflation') return record.inflation;
  }

  return undefined;
}

/**
 * Standard calculation for a single bond investment.
 */
export function calculateBondInvestment(inputs: BondInputs): CalculationResult {
  const {
    initialInvestment,
    firstYearRate,
    expectedInflation,
    expectedNbpRate = 5.25,
    margin,
    duration,
    earlyWithdrawalFee,
    bondType,
    isCapitalized,
    payoutFrequency,
    purchaseDate,
    withdrawalDate,
    isRebought,
    rebuyDiscount,
    historicalData,
    taxStrategy
  } = inputs;

  const bondDef = BOND_DEFINITIONS[bondType];
  const isInflationIndexed = bondDef?.isInflationIndexed ?? false;

  const startDate = parseISO(purchaseDate);
  const targetWithdrawalDate = parseISO(withdrawalDate);
  const maturityDate = addMonths(startDate, Math.round(duration * 12));
  
  const actualWithdrawalDate = min([targetWithdrawalDate, maturityDate]);
  const isEarlyWithdrawal = isBefore(actualWithdrawalDate, maturityDate);

  const timeline: YearlyTimelinePoint[] = [];
  
  const dBondPrice = isRebought ? new Decimal(100).minus(rebuyDiscount) : new Decimal(100);
  const numberOfBonds = new Decimal(initialInvestment).dividedBy(dBondPrice).floor();
  const actualInitialInvestment = numberOfBonds.times(dBondPrice);
  const nominalStartingValue = numberOfBonds.times(100);

  let currentNominalValue = new Decimal(nominalStartingValue);
  let cumulativeInflation = new Decimal(1);
  let totalInterestEarnedSoFar = new Decimal(0);

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
    const timeFactor = daysInPeriod > 0 ? new Decimal(daysHeldInPeriod).dividedBy(daysInPeriod) : new Decimal(1);

    if (timeFactor.lte(0) && period > 1) break;

    const lagInflation = getHistoricalValue(periodStartDate, 'inflation', 2, historicalData);

    const currentInterestRate = determineInterestRate(
      bondType,
      period,
      firstYearRate,
      expectedInflation,
      expectedNbpRate,
      margin,
      isInflationIndexed,
      lagInflation
    );

    let interestEarned = new Decimal(0);
    if (bondType === BondType.OTS) {
      interestEarned = nominalStartingValue.times(currentInterestRate.dividedBy(100)).times(3).dividedBy(12);
      if (isEarlyWithdrawal) interestEarned = new Decimal(0);
    } else {
      const annualRate = currentInterestRate.dividedBy(100);
      if (isMonthly) {
        interestEarned = currentNominalValue.times(annualRate.dividedBy(12)).times(timeFactor);
      } else {
        interestEarned = currentNominalValue.times(annualRate).times(timeFactor);
      }
    }

    const previousNominalValue = new Decimal(currentNominalValue);
    totalInterestEarnedSoFar = totalInterestEarnedSoFar.plus(interestEarned);

    let taxDeducted = new Decimal(0);
    if (!isCapitalized) {
      if (taxStrategy === TaxStrategy.STANDARD) {
        taxDeducted = calculateTaxAmount(interestEarned, taxStrategy);
      }
    } else {
      currentNominalValue = currentNominalValue.plus(interestEarned);
    }
    
    const netInterest = interestEarned.minus(taxDeducted);

    const annualInflation = Decimal.max(-0.99, new Decimal(expectedInflation).dividedBy(100));
    const periodInflation = isMonthly ? annualInflation.dividedBy(12) : annualInflation;
    cumulativeInflation = cumulativeInflation.times(new Decimal(1).plus(periodInflation.times(timeFactor)));
    const realValue = (isCapitalized ? currentNominalValue : nominalStartingValue).dividedBy(cumulativeInflation);

    const currentWithdrawalFee = calculateEarlyWithdrawalFee(
      bondType,
      isEarlyWithdrawal,
      isWithdrawalPeriod,
      totalInterestEarnedSoFar,
      numberOfBonds,
      earlyWithdrawalFee
    );

    const isMaturity = periodEndDate.getTime() === maturityDate.getTime();
    const isWithdrawal = periodEndDate.getTime() === actualWithdrawalDate.getTime();

    let netProfit = new Decimal(0);
    let earlyWithdrawalValue = new Decimal(0);

    if (isCapitalized) {
      const grossValueNow = currentNominalValue;
      const totalProfitNow = grossValueNow.minus(nominalStartingValue);
      const taxableBase = taxStrategy === TaxStrategy.IKZE ? grossValueNow.minus(currentWithdrawalFee) : totalProfitNow.minus(currentWithdrawalFee);
      const taxOnWithdrawal = calculateTaxAmount(Decimal.max(0, taxableBase), taxStrategy);
      
      netProfit = grossValueNow.minus(currentWithdrawalFee).minus(taxOnWithdrawal).minus(actualInitialInvestment);
      earlyWithdrawalValue = grossValueNow.minus(currentWithdrawalFee).minus(taxOnWithdrawal);
    } else {
      const grossValueNow = nominalStartingValue.plus(totalInterestEarnedSoFar);
      const taxableBase = taxStrategy === TaxStrategy.IKZE ? grossValueNow.minus(currentWithdrawalFee) : totalInterestEarnedSoFar.minus(currentWithdrawalFee);
      const taxOnWithdrawal = calculateTaxAmount(Decimal.max(0, taxableBase), taxStrategy);

      netProfit = grossValueNow.minus(currentWithdrawalFee).minus(taxOnWithdrawal).minus(actualInitialInvestment);
      earlyWithdrawalValue = grossValueNow.minus(currentWithdrawalFee).minus(taxOnWithdrawal);
    }

    timeline.push({
      year: isMonthly ? Math.ceil(period / 12) : period,
      periodLabel: isMaturity ? 'Maturity' : (isMonthly ? `Month ${period}` : `Year ${period}`),
      interestRate: currentInterestRate.toNumber(),
      nominalValueBeforeInterest: previousNominalValue.toNumber(),
      interestEarned: interestEarned.toNumber(),
      taxDeducted: taxDeducted.toNumber(),
      netInterest: netInterest.toNumber(),
      nominalValueAfterInterest: isCapitalized ? currentNominalValue.toNumber() : nominalStartingValue.toNumber(),
      realValue: realValue.toNumber(),
      netProfit: netProfit.toNumber(),
      earlyWithdrawalValue: Decimal.max(actualInitialInvestment, earlyWithdrawalValue).toNumber(),
      cumulativeInflation: cumulativeInflation.toNumber(),
      isMaturity,
      isWithdrawal
    });

    if (isWithdrawal) break;
  }

  const lastPoint = timeline[timeline.length - 1];
  const finalFee = isEarlyWithdrawal ? calculateEarlyWithdrawalFee(bondType, true, true, totalInterestEarnedSoFar, numberOfBonds, earlyWithdrawalFee) : new Decimal(0);
  
  const grossValueAtEnd = isCapitalized ? currentNominalValue : nominalStartingValue.plus(totalInterestEarnedSoFar);
  const finalTaxableBase = taxStrategy === TaxStrategy.IKZE ? grossValueAtEnd.minus(finalFee) : totalInterestEarnedSoFar.minus(finalFee);
  const totalTax = calculateTaxAmount(Decimal.max(0, finalTaxableBase), taxStrategy);
  
  const netPayoutValue = grossValueAtEnd.minus(finalFee).minus(totalTax);

  return {
    initialInvestment: actualInitialInvestment.toNumber(),
    timeline,
    finalNominalValue: (isCapitalized ? currentNominalValue : nominalStartingValue).toNumber(),
    finalRealValue: lastPoint.realValue,
    totalProfit: netPayoutValue.minus(actualInitialInvestment).toNumber(),
    totalTax: totalTax.toNumber(),
    totalEarlyWithdrawalFee: finalFee.toNumber(),
    grossValue: grossValueAtEnd.toNumber(),
    netPayoutValue: netPayoutValue.toNumber(),
    isEarlyWithdrawal,
    maturityDate: maturityDate.toISOString()
  };
}

/**
 * Regular investment calculator using modular engine.
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
    isCapitalized,
    purchaseDate,
    withdrawalDate,
    isRebought,
    rebuyDiscount,
    historicalData,
    taxStrategy
  } = inputs;

  const startPurchaseDate = parseISO(purchaseDate);
  const targetWithdrawalDate = parseISO(withdrawalDate);
  
  const totalMonths = totalHorizon * 12;
  const interval = frequency === InvestmentFrequency.MONTHLY ? 1 : 
                   frequency === InvestmentFrequency.QUARTERLY ? 3 : 12;

  const lots: LotBreakdown[] = [];
  const timeline: RegularTimelinePoint[] = [];
  
  let totalInvested = new Decimal(0);
  let cumulativeInflation = new Decimal(1);
  const monthlyInflation = new Decimal(expectedInflation).dividedBy(12).dividedBy(100);
  const bondPrice = isRebought ? new Decimal(100).minus(rebuyDiscount) : new Decimal(100);

  for (let m = 0; m <= totalMonths; m++) {
    const currentMonthDate = addMonths(startPurchaseDate, m);
    if (isAfter(currentMonthDate, targetWithdrawalDate)) break;

    if (m % interval === 0 && m < totalMonths) {
      const units = new Decimal(contributionAmount).dividedBy(bondPrice).floor();
      const investedAmount = units.times(bondPrice);
      const nominalAmount = units.times(100);
      
      if (units.gt(0)) {
        const lotDuration = bondType === BondType.OTS ? 0.25 : inputs.duration;
        const lotMaturityDate = addMonths(currentMonthDate, Math.round(lotDuration * 12));
        lots.push({
          purchaseDate: currentMonthDate.toISOString(),
          maturityDate: lotMaturityDate.toISOString(),
          isMatured: false,
          investedAmount: investedAmount.toNumber(),
          accumulatedInterest: 0,
          tax: 0,
          earlyWithdrawalFee: 0,
          grossValue: nominalAmount.toNumber(),
          netValue: nominalAmount.toNumber()
        });
        totalInvested = totalInvested.plus(investedAmount);
      }
    }

    lots.forEach(lot => {
      const lotPurchaseDate = parseISO(lot.purchaseDate);
      const lotMaturityDate = parseISO(lot.maturityDate);
      
      if (isAfter(currentMonthDate, lotPurchaseDate)) {
        const monthsHeld = differenceInMonths(currentMonthDate, lotPurchaseDate);
        const lotDuration = bondType === BondType.OTS ? 0.25 : inputs.duration;
        const bondDurationMonths = Math.round(lotDuration * 12);
        
        const dLotGrossValue = new Decimal(lot.grossValue);
        const dLotAccumulatedInterest = new Decimal(lot.accumulatedInterest);
        const dLotTax = new Decimal(lot.tax);

        if (monthsHeld <= bondDurationMonths) {
          const periodIdx = Math.ceil(monthsHeld / (bondType === BondType.OTS ? 3 : 12)) || 1;
          const periodDate = addMonths(lotPurchaseDate, (periodIdx - 1) * 12);

          const currentAnnualRate = determineInterestRate(
            bondType,
            periodIdx,
            firstYearRate,
            expectedInflation,
            expectedNbpRate ?? 5.25,
            margin,
            bondType === BondType.EDO || bondType === BondType.COI || bondType === BondType.ROS || bondType === BondType.ROD,
            getHistoricalValue(periodDate, 'inflation', 2, historicalData)
          );

          const monthlyRate = currentAnnualRate.dividedBy(12).dividedBy(100);
          const interestThisMonth = dLotGrossValue.times(monthlyRate);
          
          const newAccumulatedInterest = dLotAccumulatedInterest.plus(interestThisMonth);
          lot.accumulatedInterest = newAccumulatedInterest.toNumber();

          if (isCapitalized) {
            lot.grossValue = dLotGrossValue.plus(interestThisMonth).toNumber();
          } else {
            if (taxStrategy === TaxStrategy.STANDARD) {
              const taxThisMonth = calculateTaxAmount(interestThisMonth, taxStrategy);
              lot.tax = dLotTax.plus(taxThisMonth).toNumber();
            }
          }
        }
        
        lot.isMatured = !isBefore(currentMonthDate, lotMaturityDate);
        
        const dFinalAccumulatedInterest = new Decimal(lot.accumulatedInterest);
        const units = new Decimal(lot.investedAmount).dividedBy(bondPrice).floor();
        
        const dFinalFee = calculateEarlyWithdrawalFee(
          bondType,
          !lot.isMatured,
          !lot.isMatured,
          dFinalAccumulatedInterest,
          units,
          earlyWithdrawalFee
        );
        lot.earlyWithdrawalFee = dFinalFee.toNumber();

        const currentGrossValue = isCapitalized ? new Decimal(lot.grossValue) : units.times(100).plus(dFinalAccumulatedInterest);
        const finalTaxableBase = taxStrategy === TaxStrategy.IKZE ? currentGrossValue.minus(dFinalFee) : dFinalAccumulatedInterest.minus(dFinalFee);
        const exitTax = calculateTaxAmount(Decimal.max(0, finalTaxableBase), taxStrategy);
        
        const currentTaxPaid = (isCapitalized || taxStrategy !== TaxStrategy.STANDARD) ? exitTax : new Decimal(lot.tax);
        
        const finalNetValue = currentGrossValue.minus(currentTaxPaid).minus(dFinalFee);
        lot.netValue = finalNetValue.toNumber();
        if (isCapitalized || taxStrategy !== TaxStrategy.STANDARD) {
          lot.tax = exitTax.toNumber();
        }
      }
    });

    if (m > 0) {
      cumulativeInflation = cumulativeInflation.times(new Decimal(1).plus(monthlyInflation));
    }

    let currentNominalValueTotal = new Decimal(0);
    let currentProfitTotal = new Decimal(0);
    let currentTaxTotal = new Decimal(0);
    let currentFeesTotal = new Decimal(0);

    lots.forEach(lot => {
      const units = new Decimal(lot.investedAmount).dividedBy(bondPrice).floor();
      const nominalStarting = units.times(100);
      currentNominalValueTotal = currentNominalValueTotal.plus(isCapitalized ? lot.grossValue : nominalStarting);
      currentProfitTotal = currentProfitTotal.plus(new Decimal(lot.netValue).minus(lot.investedAmount));
      currentTaxTotal = currentTaxTotal.plus(lot.tax);
      currentFeesTotal = currentFeesTotal.plus(lot.earlyWithdrawalFee);
    });

    if (m % 3 === 0 || m === totalMonths || currentMonthDate.getTime() === targetWithdrawalDate.getTime()) {
      timeline.push({
        month: m,
        date: currentMonthDate.toISOString(),
        totalInvested: totalInvested.toNumber(),
        nominalValue: currentNominalValueTotal.toNumber(),
        realValue: currentNominalValueTotal.dividedBy(cumulativeInflation).toNumber(),
        profit: currentProfitTotal.toNumber(),
        tax: currentTaxTotal.toNumber(),
        earlyWithdrawalFees: currentFeesTotal.toNumber()
      });
    }

    if (currentMonthDate.getTime() === targetWithdrawalDate.getTime()) break;
  }

  const lastPoint = timeline[timeline.length - 1];

  return {
    totalInvested: totalInvested.toNumber(),
    finalNominalValue: lastPoint.nominalValue,
    finalRealValue: lastPoint.realValue,
    totalProfit: lastPoint.profit,
    totalTax: lastPoint.tax,
    totalEarlyWithdrawalFees: lastPoint.earlyWithdrawalFees,
    timeline,
    lots
  };
}
