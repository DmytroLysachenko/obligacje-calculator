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
import { BOND_DEFINITIONS } from '../constants/bond-definitions';
import { addMonths, differenceInMonths, isAfter, isBefore, min, parseISO } from 'date-fns';
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
  } = normalizedInputs;

  let currentInitialInvestment = new Decimal(initialInvestment);
  let leftoverCash = new Decimal(0);
  const globalTimeline: YearlyTimelinePoint[] = [];
  let totalTaxAcc = new Decimal(0);
  let totalFeeAcc = new Decimal(0);
  let globalAccumulatedNetInterest = new Decimal(0);
  let currentPurchaseDate = startDate;
  let isCurrentlyRebought = isRebought;
  let cycleIndex = 1;
  const calculationNotes: string[] = [];
  const dataQualityFlags = new Set<string>();

  // Add initial starting point for the whole simulation
  globalTimeline.push(createInitialTimelinePoint({
    startDate,
    firstYearRate,
    initialInvestment,
    expectedInflation,
    expectedNbpRate,
  }));

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

    const periods = generateCyclePeriods(currentPurchaseDate, cycleMaturityDate, actualCycleEndDate, payoutFrequency, bondDuration);

    for (let i = 0; i < periods.length; i++) {
      const period = periods[i];
      const monthsIntoCycle = differenceInMonths(period.startDate, currentPurchaseDate);

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
        }
      } else if (isInflationIndexed) {
        const isFirstYear = monthsIntoCycle < 12;
        if (isFirstYear) {
          rateSource = 'first_year_fixed';
          rateReferenceValue = firstYearRate;
          rateMarginApplied = 0;
        } else {
          usedProjectedRate = isProjected;
          rateSource = lagInflation !== undefined ? 'historical_cpi_lag' : 'projected_cpi';
          rateReferenceValue = lagInflation !== undefined ? lagInflation : activeExpectedInflation;
        }
      } else {
        rateSource = 'fixed_rate';
        rateReferenceValue = firstYearRate;
        rateMarginApplied = 0;
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

      let taxDeducted = new Decimal(0);
      if (shouldWithholdPeriodicTax(taxStrategy, isCapitalized)) {
        // Only withhold in the loop if it's NOT an early withdrawal point
        // In Poland, every periodic interest payout is taxed and rounded.
        if (!period.isWithdrawal || !isEarlyWithdrawal) {
          taxDeducted = calculateTaxAmount(interestEarned, taxStrategy, true);
          periodicTaxPaidSoFar = periodicTaxPaidSoFar.plus(taxDeducted);
        }
      } else {
        if (isCapitalized) {
          currentNominalValue = currentNominalValue.plus(interestEarned);
        }
      }
      
      const netInterest = interestEarned.minus(taxDeducted);
      globalAccumulatedNetInterest = globalAccumulatedNetInterest.plus(netInterest);

      // Inflation tracking for global real value with exact yearly compounding
      const totalMonthsSoFar = differenceInMonths(period.endDate, startDate);
      const cumulativeInflation = calculateCumulativeInflation(
        totalMonthsSoFar,
        expectedInflation,
        inputs.customInflation,
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

      // Official rounding for tax at exit
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
      
      const liquidationValue = currentGrossValue.minus(currentWithdrawalFee).minus(currentTaxAtPoint);
      const totalValue = liquidationValue;
      const realValue = calculateRealValue(totalValue, cumulativeInflation);

      globalTimeline.push({
        year: totalMonthsSoFar / 12, // accurate fractional years
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
        netProfit: 0, // calculated at very end
        earlyWithdrawalValue: 0, // legacy
        cumulativeInflation: cumulativeInflation.toNumber(),
        isMaturity: period.isMaturity,
        isWithdrawal: period.endDate.getTime() === targetWithdrawalDate.getTime(),
        isProjected,
        inflationReference: lagInflation !== undefined ? lagInflation : activeExpectedInflation,
        nbpReference: lagNbp !== undefined ? lagNbp : expectedNbpRate,
      });

      if (period.isWithdrawal) break;
    }

    // End of cycle: calculate net cash
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
      if (rollover) {
        calculationNotes.push(`Simulation covered ${cycleIndex} bond cycle${cycleIndex === 1 ? '' : 's'} across the selected horizon.`);
      } else {
        calculationNotes.push('Rollover is disabled; the simulation stops at the first bond cycle or selected withdrawal date.');
      }
      if (isEarlyWithdrawal) {
        calculationNotes.push('Early redemption fee logic was applied before the native maturity date.');
      }
      return createFinalSingleBondResult({
        initialInvestment,
        timeline: globalTimeline,
        cycleGrossValue,
        cycleNetProceeds: netProceeds,
        totalTax: totalTaxAcc,
        totalFee: totalFeeAcc,
        isEarlyWithdrawal,
        cycleMaturityDate,
        calculationNotes,
        dataQualityFlags: Array.from(dataQualityFlags),
      });
    }

    // Roll over: Re-invest netProceeds into next cycle
    currentInitialInvestment = netProceeds;
    // RESET globalAccumulatedNetInterest for the next cycle because they are now part of the principal
    globalAccumulatedNetInterest = new Decimal(0);
    currentPurchaseDate = actualCycleEndDate;
    isCurrentlyRebought = rebuyDiscount > 0; // Only eligible rollover cycles should use swap pricing
    cycleIndex += 1;
  }

  // Fallback (should not be reached)
  return {} as CalculationResult;
}

/**
 * Regular investment calculator using modular engine.
 */
export function calculateRegularInvestment(inputs: RegularInvestmentInputs): RegularInvestmentResult {
  const normalizedInputs = normalizeRegularInvestmentInputs(inputs);
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
    purchaseDate: startPurchaseDate,
    withdrawalDate: targetWithdrawalDate,
    isRebought,
    rebuyDiscount,
    historicalData,
    taxStrategy
  } = normalizedInputs;

  const bondDef = BOND_DEFINITIONS[bondType];
  const nominalValue = bondDef?.nominalValue ?? 100;

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
        const shouldWithholdTaxForLot = shouldWithholdPeriodicTax(taxStrategy, isCapitalized);

        if (monthsHeld <= bondDurationMonths) {
          // Pass monthsIntoCycle (0-based) to DetermineInterestRate
          // monthsHeld is 1 after first month. So month index is monthsHeld - 1.
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
        realValue: calculateRealValue(currentNominalValueTotal, cumulativeInflation).toNumber(),
        profit: currentProfitTotal.toNumber(),
        tax: currentTaxTotal.toNumber(),
        earlyWithdrawalFees: currentFeesTotal.toNumber(),
        isProjected: currentIsProjected
      });
    }

    if (isWithdrawalStep) break;
  }

  return createRegularInvestmentResult(totalInvested, totalHorizon, timeline, lots);
}
