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
 * Pre-processed map for fast historical data lookups.
 */
const HISTORICAL_DATA_MAP = new Map(HISTORICAL_RETURNS.map(r => [r.date, r]));

/**
 * Helper to get historical data for a specific date with optional lag.
 */
function getHistoricalValue(
  targetDate: Date, 
  type: 'inflation' | 'nbpRate',
  lagMonths: number = 2,
  providedData?: HistoricalDataMap
): { value: number | undefined; isProjected: boolean } {
  const lookbackDate = subMonths(targetDate, lagMonths);
  const key = format(lookbackDate, 'yyyy-MM');
  
  if (providedData && providedData[key]) {
    const val = providedData[key][type];
    if (val !== undefined) return { value: val, isProjected: false };
  }

  const record = HISTORICAL_DATA_MAP.get(key);
  if (record) {
    if (type === 'inflation') return { value: record.inflation, isProjected: false };
  }

  return { value: undefined, isProjected: true };
}

/**
 * Standard calculation for a single bond investment.
 * Supports "rollover" (re-investing at maturity) for multi-year comparisons.
 */
export function calculateBondInvestment(inputs: BondInputs & { rollover?: boolean }): CalculationResult {
  const {
    initialInvestment,
    firstYearRate,
    expectedInflation,
    expectedNbpRate = 5.25,
    margin,
    duration: bondDuration,
    earlyWithdrawalFee,
    bondType,
    isCapitalized,
    payoutFrequency,
    purchaseDate,
    withdrawalDate,
    isRebought,
    rebuyDiscount,
    historicalData,
    taxStrategy,
    rollover = false
  } = inputs;

  const startDate = parseISO(purchaseDate);
  const targetWithdrawalDate = parseISO(withdrawalDate);
  
  let currentInitialInvestment = new Decimal(initialInvestment);
  let leftoverCash = new Decimal(0);
  const globalTimeline: YearlyTimelinePoint[] = [];
  let totalTaxAcc = new Decimal(0);
  let totalFeeAcc = new Decimal(0);
  let globalAccumulatedNetInterest = new Decimal(0);
  let currentPurchaseDate = startDate;
  let isCurrentlyRebought = isRebought;

  // Add initial starting point for the whole simulation
  globalTimeline.push({
    year: 0,
    periodLabel: format(startDate, 'MMM yyyy'),
    interestRate: firstYearRate,
    nominalValueBeforeInterest: initialInvestment,
    interestEarned: 0,
    taxDeducted: 0,
    netInterest: 0,
    nominalValueAfterInterest: initialInvestment,
    accumulatedNetInterest: 0,
    totalValue: initialInvestment,
    realValue: initialInvestment,
    netProfit: 0,
    earlyWithdrawalValue: 0,
    cumulativeInflation: 1,
    isMaturity: false,
    isWithdrawal: false,
    isProjected: false,
    inflationReference: expectedInflation,
    nbpReference: expectedNbpRate,
  });

  // We loop until we cover the whole simulation period (supporting multiple rollovers)
  while (isBefore(currentPurchaseDate, targetWithdrawalDate)) {
    const bondDef = BOND_DEFINITIONS[bondType];
    const isInflationIndexed = bondDef?.isInflationIndexed ?? false;
    const nominalValue = bondDef?.nominalValue ?? 100;
    
    // Duration of THIS specific cycle
    const cycleMaturityDate = addMonths(currentPurchaseDate, Math.round(bondDuration * 12));
    const actualCycleEndDate = min([targetWithdrawalDate, cycleMaturityDate]);
    const isEarlyWithdrawal = isBefore(actualCycleEndDate, cycleMaturityDate);

    const dBondPrice = isCurrentlyRebought ? new Decimal(nominalValue).minus(rebuyDiscount) : new Decimal(nominalValue);
    
    // Investment for THIS cycle = cash from previous cycle + any leftovers
    const totalAvailable = currentInitialInvestment.plus(leftoverCash);
    const numberOfBonds = totalAvailable.dividedBy(dBondPrice).floor();
    const cycleInitialInvestment = numberOfBonds.times(dBondPrice);
    leftoverCash = totalAvailable.minus(cycleInitialInvestment);
    
    const nominalStartingValue = numberOfBonds.times(nominalValue);

    let currentNominalValue = new Decimal(nominalStartingValue);
    let totalInterestEarnedSoFar = new Decimal(0);

    const isMonthly = payoutFrequency === InterestPayout.MONTHLY;
    const periods = isMonthly ? Math.round(bondDuration * 12) : Math.ceil(bondDuration);
    const addPeriod = isMonthly ? addMonths : addYears;

    for (let period = 1; period <= periods; period++) {
      const periodStartDate = addPeriod(currentPurchaseDate, period - 1);
      const periodEndDateNorm = addPeriod(currentPurchaseDate, period);
      
      if (isAfter(periodStartDate, actualCycleEndDate) && period > 1) break;

      const isWithdrawalPeriod = isBefore(actualCycleEndDate, periodEndDateNorm) || actualCycleEndDate.getTime() === periodEndDateNorm.getTime();
      const periodEndDate = min([periodEndDateNorm, actualCycleEndDate]);
      
      const daysInPeriod = differenceInDays(periodEndDateNorm, periodStartDate);
      const daysHeldInPeriod = differenceInDays(periodEndDate, periodStartDate);
      const timeFactor = daysInPeriod > 0 ? new Decimal(daysHeldInPeriod).dividedBy(daysInPeriod) : new Decimal(1);

      if (timeFactor.lte(0) && period > 1) break;

      const { value: lagInflation, isProjected } = getHistoricalValue(periodStartDate, 'inflation', 2, historicalData);

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
      globalAccumulatedNetInterest = globalAccumulatedNetInterest.plus(netInterest);

      // Inflation tracking for global real value
      const totalMonthsSoFar = differenceInMonths(periodEndDate, startDate);
      const cumulativeInflation = new Decimal(1).plus(new Decimal(expectedInflation).dividedBy(100)).pow(totalMonthsSoFar / 12);
      
      const currentNominalPrincipal = isCapitalized ? currentNominalValue : nominalStartingValue;
      
      const isMaturity = periodEndDate.getTime() === cycleMaturityDate.getTime();
      const isWithdrawal = periodEndDate.getTime() === actualCycleEndDate.getTime();

      const currentWithdrawalFee = calculateEarlyWithdrawalFee(
        bondType,
        isEarlyWithdrawal,
        isWithdrawalPeriod,
        totalInterestEarnedSoFar,
        numberOfBonds,
        earlyWithdrawalFee
      );

      // Official rounding for tax at exit
      const useOfficialRounding = isWithdrawal;

      const currentGrossValue = isCapitalized ? currentNominalValue : nominalStartingValue.plus(totalInterestEarnedSoFar);
      const taxableBase = taxStrategy === TaxStrategy.IKZE ? currentGrossValue.minus(currentWithdrawalFee) : totalInterestEarnedSoFar.minus(currentWithdrawalFee);
      const currentTaxAtPoint = calculateTaxAmount(Decimal.max(0, taxableBase), taxStrategy, useOfficialRounding);
      
      const liquidationValue = currentGrossValue.minus(currentWithdrawalFee).minus(currentTaxAtPoint);
      const totalValue = liquidationValue;
      const realValue = totalValue.dividedBy(cumulativeInflation);

      const { value: lagNbp } = getHistoricalValue(periodStartDate, 'nbpRate', 0, historicalData);

      globalTimeline.push({
        year: totalMonthsSoFar / 12, // accurate fractional years
        periodLabel: format(periodEndDate, 'MMM yyyy'),
        interestRate: currentInterestRate.toNumber(),
        nominalValueBeforeInterest: previousNominalValue.toNumber(),
        interestEarned: interestEarned.toNumber(),
        taxDeducted: taxDeducted.toNumber(),
        netInterest: netInterest.toNumber(),
        nominalValueAfterInterest: currentNominalPrincipal.toNumber(),
        accumulatedNetInterest: globalAccumulatedNetInterest.toNumber(),
        totalValue: totalValue.toNumber(),
        realValue: realValue.toNumber(),
        netProfit: 0, // calculated at very end
        earlyWithdrawalValue: 0, // legacy
        cumulativeInflation: cumulativeInflation.toNumber(),
        isMaturity,
        isWithdrawal: periodEndDate.getTime() === targetWithdrawalDate.getTime(),
        isProjected,
        inflationReference: lagInflation !== undefined ? lagInflation : expectedInflation,
        nbpReference: lagNbp !== undefined ? lagNbp : expectedNbpRate,
      });

      if (isWithdrawal) break;
    }

    // End of cycle: calculate net cash
    const cycleLastPoint = globalTimeline[globalTimeline.length - 1];
    const cycleFee = isEarlyWithdrawal ? calculateEarlyWithdrawalFee(bondType, true, true, totalInterestEarnedSoFar, numberOfBonds, earlyWithdrawalFee) : new Decimal(0);
    const cycleGrossValue = isCapitalized ? currentNominalValue : nominalStartingValue.plus(totalInterestEarnedSoFar);
    const cycleTaxableBase = taxStrategy === TaxStrategy.IKZE ? cycleGrossValue.minus(cycleFee) : totalInterestEarnedSoFar.minus(cycleFee);
    
    // Total cycle tax calculation for final proceeds
    const cycleTax = calculateTaxAmount(Decimal.max(0, cycleTaxableBase), taxStrategy, true);
    
    // Important: if not capitalized, we already paid tax monthly (in STANDARD strategy)
    // But calculateTaxAmount(..., true) handles rounding. 
    // For ROR, cycleTax here will be the total tax for the year.
    // If we were paying monthly, we need to make sure we don't double count or have rounding issues.
    // The current engine reinvests netProceeds.
    
    totalTaxAcc = totalTaxAcc.plus(cycleTax);
    totalFeeAcc = totalFeeAcc.plus(cycleFee);

    const netProceeds = cycleGrossValue.minus(cycleFee).minus(cycleTax);

    if (!rollover || isEarlyWithdrawal || actualCycleEndDate.getTime() === targetWithdrawalDate.getTime()) {
      // End simulation
      return {
        initialInvestment: initialInvestment,
        timeline: globalTimeline,
        finalNominalValue: cycleGrossValue.toNumber(),
        finalRealValue: cycleLastPoint.realValue,
        totalProfit: netProceeds.minus(initialInvestment).toNumber(),
        totalTax: totalTaxAcc.toNumber(),
        totalEarlyWithdrawalFee: totalFeeAcc.toNumber(),
        grossValue: cycleGrossValue.toNumber(),
        netPayoutValue: netProceeds.toNumber(),
        isEarlyWithdrawal,
        maturityDate: cycleMaturityDate.toISOString()
      };
    }

    // Roll over: Re-invest netProceeds into next cycle
    currentInitialInvestment = netProceeds;
    // RESET globalAccumulatedNetInterest for the next cycle because they are now part of the principal
    globalAccumulatedNetInterest = new Decimal(0);
    currentPurchaseDate = actualCycleEndDate;
    isCurrentlyRebought = true; // Sub-sequent cycles always use re-buy discount
  }

  // Fallback (should not be reached)
  return {} as CalculationResult;
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
    expectedNbpRate = 5.25,
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

  const bondDef = BOND_DEFINITIONS[bondType];
  const nominalValue = bondDef?.nominalValue ?? 100;

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
  const bondPrice = isRebought ? new Decimal(nominalValue).minus(rebuyDiscount) : new Decimal(nominalValue);

  for (let m = 0; m <= totalMonths; m++) {
    const currentMonthDate = addMonths(startPurchaseDate, m);
    if (isAfter(currentMonthDate, targetWithdrawalDate)) break;

    const isWithdrawalStep = currentMonthDate.getTime() === targetWithdrawalDate.getTime();

    // 1. Handle matured lots and rollover capital
    let maturedLiquidity = new Decimal(0);
    lots.forEach(lot => {
      const lotMaturityDate = parseISO(lot.maturityDate);
      // If lot matures THIS month, harvest its net value for reinvestment
      if (!lot.isMatured && (currentMonthDate.getTime() === lotMaturityDate.getTime() || isAfter(currentMonthDate, lotMaturityDate))) {
        lot.isMatured = true;
        maturedLiquidity = maturedLiquidity.plus(lot.netValue);
      }
    });

    // 2. Add new lot (Standard contribution + Matured liquidity)
    if (m % interval === 0 && m < totalMonths) {
      const totalAvailableForPurchase = new Decimal(contributionAmount).plus(maturedLiquidity);
      const units = totalAvailableForPurchase.dividedBy(bondPrice).floor();
      const investedAmount = units.times(bondPrice);
      const nominalAmount = units.times(nominalValue);

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
        // We only track "fresh" money in totalInvested, not reinvested matured capital
        totalInvested = totalInvested.plus(contributionAmount);
      }
    }

    // 2. Pre-calculate rates for this month to avoid N*H lookups
    const { value: currentLagInflation, isProjected: currentIsProjected } = getHistoricalValue(currentMonthDate, 'inflation', 2, historicalData);

    // We only need two potential interest rates per month: Year 1 and Year 2+
    const rateYear1 = determineInterestRate(
      bondType, 1, firstYearRate, expectedInflation, expectedNbpRate, margin, 
      bondDef.isInflationIndexed, currentLagInflation
    );
    const rateIndexed = determineInterestRate(
      bondType, 2, firstYearRate, expectedInflation, expectedNbpRate, margin, 
      bondDef.isInflationIndexed, currentLagInflation
    );

    const monthlyRateYear1 = rateYear1.dividedBy(12).dividedBy(100);
    const monthlyRateIndexed = rateIndexed.dividedBy(12).dividedBy(100);

    // 3. Update all active lots
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
          // Re-calculate periodIdx only once per lot update
          const periodIdx = Math.ceil(monthsHeld / 12) || 1;
          const currentMonthlyRate = periodIdx === 1 ? monthlyRateYear1 : monthlyRateIndexed;

          const interestThisMonth = dLotGrossValue.times(currentMonthlyRate);

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

        const currentGrossValue = isCapitalized ? new Decimal(lot.grossValue) : units.times(nominalValue).plus(dFinalAccumulatedInterest);
        const finalTaxableBase = taxStrategy === TaxStrategy.IKZE ? currentGrossValue.minus(dFinalFee) : dFinalAccumulatedInterest.minus(dFinalFee);

        // Apply official rounding ONLY at withdrawal step for the lot
        const useOfficialRounding = isWithdrawalStep;
        const exitTax = calculateTaxAmount(Decimal.max(0, finalTaxableBase), taxStrategy, useOfficialRounding);

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
      const nominalStarting = units.times(nominalValue);
      currentNominalValueTotal = currentNominalValueTotal.plus(isCapitalized ? lot.grossValue : nominalStarting);
      currentProfitTotal = currentProfitTotal.plus(new Decimal(lot.netValue).minus(lot.investedAmount));
      currentTaxTotal = currentTaxTotal.plus(lot.tax);
      currentFeesTotal = currentFeesTotal.plus(lot.earlyWithdrawalFee);
    });

    if (m % 3 === 0 || m === totalMonths || isWithdrawalStep) {
      timeline.push({
        month: m,
        date: currentMonthDate.toISOString(),
        totalInvested: totalInvested.toNumber(),
        nominalValue: currentNominalValueTotal.toNumber(),
        realValue: currentNominalValueTotal.dividedBy(cumulativeInflation).toNumber(),
        profit: currentProfitTotal.toNumber(),
        tax: currentTaxTotal.toNumber(),
        earlyWithdrawalFees: currentFeesTotal.toNumber(),
        isProjected: currentIsProjected
      });
    }

    if (isWithdrawalStep) break;
  }

  const lastPoint = timeline[timeline.length - 1];

  // Calculate Real Annualized Return (CAGR)
  // Formula: [(Final Real Value / Total Invested) ^ (1/years)] - 1
  let realAnnualizedReturn = 0;
  if (totalHorizon > 0 && totalInvested.gt(0)) {
    const totalMultiplier = new Decimal(lastPoint.realValue).dividedBy(totalInvested);
    if (totalMultiplier.gt(0)) {
      realAnnualizedReturn = Math.pow(totalMultiplier.toNumber(), 1 / totalHorizon) - 1;
    }
  }

  return {
    totalInvested: totalInvested.toNumber(),
    finalNominalValue: lastPoint.nominalValue,
    finalRealValue: lastPoint.realValue,
    totalProfit: lastPoint.profit,
    totalTax: lastPoint.tax,
    totalEarlyWithdrawalFees: lastPoint.earlyWithdrawalFees,
    realAnnualizedReturn: realAnnualizedReturn * 100, // Return as percentage
    timeline,
    lots
  };
}
