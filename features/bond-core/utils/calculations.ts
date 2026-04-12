import { 
  BondInputs, 
  BondType, 
  CalculationResult, 
  RateSource,
  YearlyTimelinePoint, 
  RegularInvestmentInputs,
  RegularInvestmentResult,
  InvestmentFrequency,
  RegularTimelinePoint,
  LotBreakdown,
  TaxStrategy
} from '../types';
import { SimulationEventType, SimulationEvent } from '../types/simulation';
import { BOND_DEFINITIONS } from '../constants/bond-definitions';
import { addMonths, differenceInDays, differenceInMonths, getDaysInYear, isAfter, isBefore, min, parseISO } from 'date-fns';
import { Decimal } from 'decimal.js';

// Engine imports
import { determineInterestRate } from './engine/rate-resolution';
import { calculateTaxAmount, shouldWithholdPeriodicTax } from './engine/tax-settlement';
import { calculateEarlyWithdrawalFee } from './engine/redemption';
import { getHistoricalValue } from './engine/historical-data';
import { calculateCumulativeInflation, getExpectedInflationForYearIndex } from './engine/inflation';
import { createFinalSingleBondResult, createInitialTimelinePoint, createRegularInvestmentResult } from './engine/result-assembly';
import { normalizeBondInputs, normalizeRegularInvestmentInputs } from './engine/input-normalization';
import { calculatePeriodAccrual } from './engine/accrual';
import { calculateRollover } from './engine/rollover';
import { calculateRealValue } from './engine/real-return';
import { generateCyclePeriods } from './engine/timeline-builder';

/**
 * Configures Decimal for financial precision.
 */
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Standard calculation for a single bond investment.
 * Supports "rollover" (re-investing at maturity) for multi-year comparisons.
 */
export function calculateBondInvestment(inputs: BondInputs & { rollover?: boolean }): CalculationResult {
  const rollover = inputs.rollover ?? false;
  const chartStep = inputs.chartStep;
  const normalizedInputs = normalizeBondInputs(inputs);
  const {
    initialInvestment,
    firstYearRate,
    expectedInflation,
    expectedNbpRate = 5.25,
    margin,
    actualDuration: bondDuration,
    earlyWithdrawalFee,
    bondType,
    isCapitalized,
    payoutFrequency,
    purchaseDate: startDate,
    withdrawalDate: targetWithdrawalDate,
    isRebought,
    rebuyDiscount,
    historicalData,
    taxStrategy,
    ikzeTaxBracket,
  } = normalizedInputs;

  let currentInitialInvestment = new Decimal(initialInvestment);
  const calculationNotes: string[] = [];
  
  // IKZE Tax Relief (Refund) modeling
  if (taxStrategy === TaxStrategy.IKZE && ikzeTaxBracket) {
    const refund = currentInitialInvestment.times(ikzeTaxBracket);
    currentInitialInvestment = currentInitialInvestment.plus(refund);
    calculationNotes.push(`IKZE Tax Relief applied: +${refund.toFixed(2)} PLN (${ikzeTaxBracket * 100}% bracket) reinvested upfront.`);
  }

  let leftoverCash = new Decimal(0);
  const globalTimeline: YearlyTimelinePoint[] = [];
  let totalTaxAcc = new Decimal(0);
  let totalFeeAcc = new Decimal(0);
  let globalAccumulatedNetInterest = new Decimal(0);
  let currentPurchaseDate = startDate;
  let isCurrentlyRebought = isRebought;
  let cycleIndex = 1;
  const dataQualityFlags = new Set<string>();

  // Add initial starting point for the whole simulation
  const initialPoint = createInitialTimelinePoint({
    startDate,
    firstYearRate,
    initialInvestment,
    expectedInflation,
    expectedNbpRate,
  });
  initialPoint.events = [{
    type: SimulationEventType.PURCHASE,
    date: startDate.toISOString(),
    description: `Initial investment of ${initialInvestment} PLN`,
    value: initialInvestment
  }];
  globalTimeline.push(initialPoint);

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
    const rolloverParams = calculateRollover(totalAvailable, dBondPrice);
    
    leftoverCash = rolloverParams.leftoverCash;
    const numberOfBonds = rolloverParams.numberOfBonds;
    
    const nominalStartingValue = numberOfBonds.times(nominalValue);

    let currentNominalValue = new Decimal(nominalStartingValue);
    let totalInterestEarnedSoFar = new Decimal(0);
    let periodicTaxPaidSoFar = new Decimal(0);

    const periods = generateCyclePeriods(currentPurchaseDate, cycleMaturityDate, actualCycleEndDate, payoutFrequency, bondDuration, chartStep);

    for (let i = 0; i < periods.length; i++) {
      const period = periods[i];
      const events: SimulationEvent[] = [];
      const monthsIntoCycle = differenceInMonths(period.startDate, currentPurchaseDate);

      if (i === 0) {
        events.push({
          type: cycleIndex === 1 ? SimulationEventType.PURCHASE : SimulationEventType.ROLLOVER_PURCHASE,
          date: period.startDate.toISOString(),
          description: `${cycleIndex === 1 ? 'Purchase' : 'Rollover purchase'} of ${numberOfBonds} bonds`,
          value: nominalStartingValue.toNumber()
        });
      }

      const periodYearIndex = Math.floor(differenceInMonths(period.startDate, startDate) / 12);
      const activeExpectedInflation = getExpectedInflationForYearIndex(
        expectedInflation,
        inputs.customInflation,
        periodYearIndex,
      );

      const { value: lagInflation, isProjected } = getHistoricalValue(period.startDate, 'inflation', 2, historicalData);
      const { value: lagNbp, isProjected: isNbpProjected } = getHistoricalValue(period.startDate, 'nbpRate', 0, historicalData);

      const currentInterestRate = determineInterestRate(
        bondType,
        monthsIntoCycle,
        firstYearRate,
        activeExpectedInflation,
        expectedNbpRate,
        margin,
        isInflationIndexed,
        lagInflation
      );
      
      let rateSource: RateSource = 'fixed_rate';
      let rateReferenceValue: number | undefined;
      let rateMarginApplied = margin;
      let usedProjectedRate = false;

      // Rate reset logic / events
      if (bondType === BondType.ROR || bondType === BondType.DOR) {
        const isFirstMonth = monthsIntoCycle === 0;
        if (isFirstMonth) {
          rateSource = 'first_year_fixed';
          rateReferenceValue = firstYearRate;
          rateMarginApplied = 0;
        } else {
          usedProjectedRate = isNbpProjected;
          rateSource = lagNbp !== undefined ? 'historical_nbp' : 'projected_nbp';
          rateReferenceValue = lagNbp !== undefined ? lagNbp : expectedNbpRate;
          events.push({
            type: SimulationEventType.RATE_RESET,
            date: period.startDate.toISOString(),
            description: `Rate reset based on NBP: ${currentInterestRate.toFixed(2)}%`,
            value: currentInterestRate.toNumber()
          });
        }
      } else if (isInflationIndexed) {
        const isFirstYear = monthsIntoCycle < 12;
        if (isFirstYear) {
          rateSource = 'first_year_fixed';
          rateReferenceValue = firstYearRate;
          rateMarginApplied = 0;
        } else if (monthsIntoCycle % 12 === 0) {
          usedProjectedRate = isProjected;
          rateSource = lagInflation !== undefined ? 'historical_cpi_lag' : 'projected_cpi';
          rateReferenceValue = lagInflation !== undefined ? lagInflation : activeExpectedInflation;
          events.push({
            type: SimulationEventType.RATE_RESET,
            date: period.startDate.toISOString(),
            description: `Rate reset based on Inflation: ${currentInterestRate.toFixed(2)}%`,
            value: currentInterestRate.toNumber()
          });
        }
      }

      if (usedProjectedRate) {
        dataQualityFlags.add('projected_rate_segment');
      }

      const accrual = calculatePeriodAccrual(
        currentNominalValue,
        currentInterestRate,
        period.daysHeld,
        period.daysInPeriod,
        bondType,
        payoutFrequency,
        period.startDate
      );
      
      const interestEarned = accrual.interestEarned;
      const previousNominalValue = new Decimal(currentNominalValue);
      totalInterestEarnedSoFar = totalInterestEarnedSoFar.plus(interestEarned);

      if (interestEarned.gt(0)) {
        events.push({
          type: SimulationEventType.INTEREST_ACCRUAL,
          date: period.endDate.toISOString(),
          description: `Accrued interest: ${interestEarned.toFixed(2)} PLN`,
          value: interestEarned.toNumber()
        });
      }

      let taxDeducted = new Decimal(0);
      if (shouldWithholdPeriodicTax(taxStrategy, isCapitalized)) {
        if (!period.isWithdrawal || !isEarlyWithdrawal) {
          taxDeducted = calculateTaxAmount(interestEarned, taxStrategy, true);
          periodicTaxPaidSoFar = periodicTaxPaidSoFar.plus(taxDeducted);
          if (taxDeducted.gt(0)) {
            events.push({
              type: SimulationEventType.TAX_SETTLEMENT,
              date: period.endDate.toISOString(),
              description: `Periodic tax withheld: ${taxDeducted.toFixed(2)} PLN`,
              value: taxDeducted.toNumber()
            });
            events.push({
              type: SimulationEventType.PAYOUT,
              date: period.endDate.toISOString(),
              description: `Periodic interest payout: ${interestEarned.minus(taxDeducted).toFixed(2)} PLN`,
              value: interestEarned.minus(taxDeducted).toNumber()
            });
          }
        }
      } else {
        if (isCapitalized) {
          currentNominalValue = currentNominalValue.plus(interestEarned);
        }
      }
      
      const netInterest = interestEarned.minus(taxDeducted);
      globalAccumulatedNetInterest = globalAccumulatedNetInterest.plus(netInterest);

      const totalMonthsSoFar = differenceInMonths(period.endDate, startDate);
      const cumulativeInflation = calculateCumulativeInflation(
        totalMonthsSoFar,
        expectedInflation,
        inputs.customInflation,
        startDate
      );
      
      const currentNominalPrincipal = isCapitalized ? currentNominalValue : nominalStartingValue;
      
      const currentWithdrawalFee = calculateEarlyWithdrawalFee(
        bondType,
        isEarlyWithdrawal,
        period.isWithdrawal && isEarlyWithdrawal,
        totalInterestEarnedSoFar,
        numberOfBonds,
        earlyWithdrawalFee
      );

      if (period.isWithdrawal && isEarlyWithdrawal && currentWithdrawalFee.gt(0)) {
        events.push({
          type: SimulationEventType.EARLY_REDEMPTION_FEE,
          date: period.endDate.toISOString(),
          description: `Early redemption fee: ${currentWithdrawalFee.toFixed(2)} PLN`,
          value: currentWithdrawalFee.toNumber()
        });
      }

      const useOfficialRounding = period.isWithdrawal;
      const currentGrossValue = isCapitalized ? currentNominalValue : nominalStartingValue.plus(totalInterestEarnedSoFar);
      
      const currentTaxAtPoint = shouldWithholdPeriodicTax(taxStrategy, isCapitalized)
        ? periodicTaxPaidSoFar
        : calculateTaxAmount(
            Decimal.max(
              0,
              taxStrategy === TaxStrategy.IKZE
                ? currentGrossValue.minus(currentWithdrawalFee)
                : totalInterestEarnedSoFar.minus(currentWithdrawalFee),
            ),
            taxStrategy,
            useOfficialRounding,
          );
      
      if (period.isWithdrawal && !shouldWithholdPeriodicTax(taxStrategy, isCapitalized) && currentTaxAtPoint.gt(0)) {
        events.push({
          type: SimulationEventType.TAX_SETTLEMENT,
          date: period.endDate.toISOString(),
          description: `Final tax settlement: ${currentTaxAtPoint.toFixed(2)} PLN`,
          value: currentTaxAtPoint.toNumber()
        });
      }

      if (period.isMaturity) {
        events.push({
          type: SimulationEventType.MATURITY,
          date: period.endDate.toISOString(),
          description: `Bond maturity reached`,
        });
      }

      if (period.isWithdrawal) {
        events.push({
          type: SimulationEventType.WITHDRAWAL,
          date: period.endDate.toISOString(),
          description: `Final withdrawal`,
          value: currentGrossValue.minus(currentWithdrawalFee).minus(currentTaxAtPoint).toNumber()
        });
      }

      const liquidationValue = currentGrossValue.minus(currentWithdrawalFee).minus(currentTaxAtPoint);
      const totalValue = liquidationValue;
      const realValue = calculateRealValue(totalValue, cumulativeInflation);

      globalTimeline.push({
        year: totalMonthsSoFar / 12,
        periodLabel: period.periodLabel,
        cycleIndex,
        cycleStartDate: currentPurchaseDate.toISOString(),
        cycleEndDate: actualCycleEndDate.toISOString(),
        interestRate: currentInterestRate.toNumber(),
        rateSource,
        rateReferenceValue,
        rateMarginApplied,
        usedProjectedRate,
        nominalValueBeforeInterest: previousNominalValue.toNumber(),
        interestEarned: interestEarned.toNumber(),
        taxDeducted: taxDeducted.toNumber(),
        netInterest: netInterest.toNumber(),
        nominalValueAfterInterest: currentNominalPrincipal.toNumber(),
        accumulatedNetInterest: globalAccumulatedNetInterest.toNumber(),
        totalValue: totalValue.toNumber(),
        realValue: realValue.toNumber(),
        netProfit: 0,
        earlyWithdrawalValue: 0,
        cumulativeInflation: cumulativeInflation.toNumber(),
        isMaturity: period.isMaturity,
        isWithdrawal: period.endDate.getTime() === targetWithdrawalDate.getTime(),
        isProjected,
        inflationReference: lagInflation !== undefined ? lagInflation : activeExpectedInflation,
        nbpReference: lagNbp !== undefined ? lagNbp : expectedNbpRate,
        events: events.length > 0 ? events : undefined
      });

      if (period.isWithdrawal) break;
    }

    const cycleFee = isEarlyWithdrawal ? calculateEarlyWithdrawalFee(bondType, true, true, totalInterestEarnedSoFar, numberOfBonds, earlyWithdrawalFee) : new Decimal(0);
    const cycleGrossValue = isCapitalized ? currentNominalValue : nominalStartingValue.plus(totalInterestEarnedSoFar);
    const cycleTax = shouldWithholdPeriodicTax(taxStrategy, isCapitalized)
      ? periodicTaxPaidSoFar
      : calculateTaxAmount(
          Decimal.max(
            0,
            taxStrategy === TaxStrategy.IKZE
              ? cycleGrossValue.minus(cycleFee)
              : totalInterestEarnedSoFar.minus(cycleFee),
          ),
          taxStrategy,
          true,
        );
    
    totalTaxAcc = totalTaxAcc.plus(cycleTax);
    totalFeeAcc = totalFeeAcc.plus(cycleFee);

    const netProceeds = cycleGrossValue.minus(cycleFee).minus(cycleTax);

    if (!rollover || isEarlyWithdrawal || actualCycleEndDate.getTime() === targetWithdrawalDate.getTime()) {
      const totalHorizonYears = differenceInDays(actualCycleEndDate, startDate) / 365.25;
      if (rollover) calculationNotes.push(`Simulation covered ${cycleIndex} bond cycle${cycleIndex === 1 ? '' : 's'} across the selected horizon.`);
      else calculationNotes.push('Rollover is disabled; the simulation stops at the first bond cycle or selected withdrawal date.');
      if (isEarlyWithdrawal) calculationNotes.push('Early redemption fee logic was applied before the native maturity date.');

      return createFinalSingleBondResult({
        initialInvestment,
        timeline: globalTimeline,
        cycleGrossValue,
        cycleNetProceeds: netProceeds,
        totalTax: totalTaxAcc,
        totalFee: totalFeeAcc,
        isEarlyWithdrawal,
        cycleMaturityDate,
        totalHorizonYears,
        calculationNotes,
        dataQualityFlags: Array.from(dataQualityFlags),
      });
    }

    currentInitialInvestment = netProceeds;
    globalAccumulatedNetInterest = new Decimal(0);
    currentPurchaseDate = actualCycleEndDate;
    isCurrentlyRebought = rebuyDiscount > 0;
    cycleIndex += 1;
  }

  return {} as CalculationResult;
}

/**
 * Reverse calculation to find the required initial investment to reach a target net sum.
 * Uses a binary search approach.
 */
export function calculateReverseBondInvestment(inputs: BondInputs & { targetNetSum: number }): CalculationResult {
  let low = 100;
  let high = 10_000_000;
  let result: CalculationResult = {} as CalculationResult;
  
  // 30 iterations give very high precision
  for (let i = 0; i < 30; i++) {
    const mid = (low + high) / 2;
    // Round mid to nearest 100 as bonds are usually bought in units of 100 PLN
    const roundedMid = Math.ceil(mid / 100) * 100;
    
    result = calculateBondInvestment({ ...inputs, initialInvestment: roundedMid });
    
    if (result.netPayoutValue < inputs.targetNetSum) {
      low = mid;
    } else {
      high = mid;
    }
  }

  // Ensure notes reflect reverse mode
  result.calculationNotes = [
    ...(result.calculationNotes || []),
    `Target net sum: ${inputs.targetNetSum} PLN. Required initial investment: ${result.initialInvestment} PLN.`
  ];
  
  return result;
}

/**
 * Regular investment calculator using modular engine.
 */
export function calculateRegularInvestment(inputs: RegularInvestmentInputs): RegularInvestmentResult {
  const normalizedInputs = normalizeRegularInvestmentInputs(inputs);
  const {
    contributionAmount,
    frequency,
    investmentHorizonMonths,
    bondType,
    firstYearRate,
    expectedInflation,
    expectedNbpRate = 5.25,
    margin,
    earlyWithdrawalFee,
    isCapitalized,
    purchaseDate: startPurchaseDate,
    withdrawalDate: targetWithdrawalDate,
    isRebought,
    rebuyDiscount,
    historicalData,
    taxStrategy
  } = normalizedInputs;

  const bondDef = BOND_DEFINITIONS[bondType];
  const nominalValue = bondDef?.nominalValue ?? 100;

  const totalMonths = investmentHorizonMonths;
  const interval = frequency === InvestmentFrequency.MONTHLY ? 1 : 
                   frequency === InvestmentFrequency.QUARTERLY ? 3 : 12;

  const lots: LotBreakdown[] = [];
  const timeline: RegularTimelinePoint[] = [];

  let totalInvested = new Decimal(0);
  let cumulativeInflation = new Decimal(1);
  const bondPrice = isRebought ? new Decimal(nominalValue).minus(rebuyDiscount) : new Decimal(nominalValue);

  // We loop month-by-month for simplicity in regular investment
  for (let m = 0; m <= totalMonths; m++) {
    const currentMonthDate = addMonths(startPurchaseDate, m);
    if (isAfter(currentMonthDate, targetWithdrawalDate)) break;
    const events: SimulationEvent[] = [];

    // Accurate inflation compounding for THIS month
    if (m > 0) {
      const prevMonthDate = addMonths(startPurchaseDate, m - 1);
      const daysInMonth = differenceInDays(currentMonthDate, prevMonthDate);
      const daysInYear = getDaysInYear(prevMonthDate);
      
      const yearIndex = Math.floor((m - 1) / 12);
      const annualInflation = getExpectedInflationForYearIndex(expectedInflation, inputs.customInflation, yearIndex);
      
      const monthlyFactor = new Decimal(annualInflation)
        .dividedBy(100)
        .times(daysInMonth)
        .dividedBy(daysInYear);
        
      cumulativeInflation = cumulativeInflation.times(new Decimal(1).plus(monthlyFactor));
    }

    const isWithdrawalStep = currentMonthDate.getTime() === targetWithdrawalDate.getTime();

    // 1. Handle matured lots and rollover capital
    let maturedLiquidity = new Decimal(0);
    lots.forEach(lot => {
      const lotMaturityDate = parseISO(lot.maturityDate);
      if (!lot.isMatured && (currentMonthDate.getTime() === lotMaturityDate.getTime() || isAfter(currentMonthDate, lotMaturityDate))) {
        lot.isMatured = true;
        maturedLiquidity = maturedLiquidity.plus(lot.netValue);
        events.push({
          type: SimulationEventType.MATURITY,
          date: currentMonthDate.toISOString(),
          description: `Lot from ${lot.purchaseDate} matured`,
          value: lot.netValue
        });
      }
    });

    // 2. Add new lot (Standard contribution + Matured liquidity if rollover enabled)
    if (m % interval === 0 && m < totalMonths) {
      const rolloverEnabled = inputs.rollover ?? true; // Default to true for regular investment
      const totalAvailableForPurchase = rolloverEnabled 
        ? new Decimal(contributionAmount).plus(maturedLiquidity)
        : new Decimal(contributionAmount);
      
      const units = totalAvailableForPurchase.dividedBy(bondPrice).floor();
      const investedAmount = units.times(bondPrice);
      const nominalAmount = units.times(nominalValue);

      if (units.gt(0)) {
        const lotDuration = bondType === BondType.OTS ? 0.25 : (inputs.duration || bondDef.duration);
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
        totalInvested = totalInvested.plus(contributionAmount);
        events.push({
          type: SimulationEventType.PURCHASE,
          date: currentMonthDate.toISOString(),
          description: `Purchased ${units.toNumber()} bonds`,
          value: investedAmount.toNumber()
        });
      }
    }

    // 2. Pre-calculate rates for this month to avoid N*H lookups
    const { value: currentLagInflation, isProjected: currentIsProjected } = getHistoricalValue(currentMonthDate, 'inflation', 2, historicalData);

    // 3. Update all active lots
    lots.forEach(lot => {
      const lotPurchaseDate = parseISO(lot.purchaseDate);
      const lotMaturityDate = parseISO(lot.maturityDate);

      if (isAfter(currentMonthDate, lotPurchaseDate)) {
        const monthsHeld = differenceInMonths(currentMonthDate, lotPurchaseDate);
        const lotDuration = bondType === BondType.OTS ? 0.25 : (inputs.duration || bondDef.duration);
        const bondDurationMonths = Math.round(lotDuration * 12);

        const dLotGrossValue = new Decimal(lot.grossValue);
        const dLotAccumulatedInterest = new Decimal(lot.accumulatedInterest);
        const dLotTax = new Decimal(lot.tax);
        const shouldWithholdTaxForLot = shouldWithholdPeriodicTax(taxStrategy, isCapitalized);

        if (monthsHeld <= bondDurationMonths) {
          const monthIndex = monthsHeld - 1;
          const currentInterestRate = determineInterestRate(
            bondType, monthIndex, firstYearRate, expectedInflation, expectedNbpRate, margin, 
            bondDef.isInflationIndexed, currentLagInflation
          );
          const currentMonthlyRate = currentInterestRate.dividedBy(12).dividedBy(100);

          const interestThisMonth = dLotGrossValue.times(currentMonthlyRate);
          const newAccumulatedInterest = dLotAccumulatedInterest.plus(interestThisMonth);
          lot.accumulatedInterest = newAccumulatedInterest.toNumber();

          if (isCapitalized) {
            lot.grossValue = dLotGrossValue.plus(interestThisMonth).toNumber();
          } else {
            if (shouldWithholdTaxForLot) {
              const taxThisMonth = calculateTaxAmount(interestThisMonth, taxStrategy);
              lot.tax = dLotTax.plus(taxThisMonth).toNumber();
            }
          }
        }

        lot.isMatured = !isBefore(currentMonthDate, lotMaturityDate);

        const dFinalAccumulatedInterest = new Decimal(lot.accumulatedInterest);
        const units = new Decimal(lot.investedAmount).dividedBy(bondPrice).floor();

        const isLotEarlyWithdrawal = !lot.isMatured;
        const dFinalFee = calculateEarlyWithdrawalFee(
          bondType,
          isLotEarlyWithdrawal,
          isLotEarlyWithdrawal,
          dFinalAccumulatedInterest,
          units,
          earlyWithdrawalFee
        );
        lot.earlyWithdrawalFee = dFinalFee.toNumber();

        const currentGrossValue = isCapitalized ? new Decimal(lot.grossValue) : units.times(nominalValue).plus(dFinalAccumulatedInterest);
        const currentTaxPaid = shouldWithholdTaxForLot
          ? new Decimal(lot.tax)
          : calculateTaxAmount(
              Decimal.max(
                0,
                taxStrategy === TaxStrategy.IKZE
                  ? currentGrossValue.minus(dFinalFee)
                  : dFinalAccumulatedInterest.minus(dFinalFee),
              ),
              taxStrategy,
              isWithdrawalStep,
            );

        const finalNetValue = currentGrossValue.minus(currentTaxPaid).minus(dFinalFee);
        lot.netValue = finalNetValue.toNumber();
        if (!shouldWithholdTaxForLot) {
          lot.tax = currentTaxPaid.toNumber();
        }
      }
    });

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

    if (isWithdrawalStep) {
      events.push({
        type: SimulationEventType.WITHDRAWAL,
        date: currentMonthDate.toISOString(),
        description: `Final withdrawal of all lots`,
        value: currentNominalValueTotal.minus(currentTaxTotal).minus(currentFeesTotal).toNumber()
      });
    }

    // Determine if we should record this month in timeline
    const isStep = inputs.chartStep === 'monthly' || 
                   (inputs.chartStep === 'quarterly' && m % 3 === 0) ||
                   (inputs.chartStep === 'yearly' && m % 12 === 0) ||
                   (!inputs.chartStep && m % 3 === 0);

    if (isStep || m === totalMonths || isWithdrawalStep) {
      timeline.push({
        month: m,
        date: currentMonthDate.toISOString(),
        totalInvested: totalInvested.toNumber(),
        nominalValue: currentNominalValueTotal.toNumber(),
        realValue: calculateRealValue(currentNominalValueTotal, cumulativeInflation).toNumber(),
        profit: currentProfitTotal.toNumber(),
        tax: currentTaxTotal.toNumber(),
        earlyWithdrawalFees: currentFeesTotal.toNumber(),
        isProjected: currentIsProjected,
        events: events.length > 0 ? events : undefined
      });
    }

    if (isWithdrawalStep) break;
  }

  return createRegularInvestmentResult(totalInvested, investmentHorizonMonths / 12, timeline, lots);
}
