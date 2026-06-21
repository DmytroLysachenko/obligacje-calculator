import {
  BondInputs,
  BondType,
  CalculationResult,
  RateSource,
  TaxStrategy,
  YearlyTimelinePoint,
} from '../../types';
import { SimulationEvent, SimulationEventType } from '../../types/simulation';
import { BOND_DEFINITIONS } from '../../constants/bond-definitions';
import { addMonths, differenceInDays, differenceInMonths, isBefore, min } from 'date-fns';
import { Decimal } from 'decimal.js';
import { createNumericFaultError } from '../../errors';
import { withMathGuard } from '../engine-guards';
import { calculatePeriodAccrual } from './accrual';
import { getHistoricalValue } from './historical-data';
import { calculateCumulativeInflation, getExpectedInflationForYearIndex } from './inflation';
import { normalizeBondInputs } from './input-normalization';
import { determineInterestRate } from './rate-resolution';
import { calculateRealValue } from './real-return';
import { calculateEarlyWithdrawalFee } from './redemption';
import { createFinalSingleBondResult, createInitialTimelinePoint } from './result-assembly';
import { calculateRollover } from './rollover';
import { calculateTaxAmount, shouldWithholdPeriodicTax } from './tax-settlement';
import { generateCyclePeriods } from './timeline-builder';

/**
 * Standard calculation for a single bond investment.
 * Supports "rollover" (re-investing at maturity) for multi-year comparisons.
 */
export const calculateBondInvestment = withMathGuard(function calculateBondInvestment(inputs: BondInputs & { rollover?: boolean }): CalculationResult {
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
    taxRate,
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
  let applySwapDiscountThisCycle = false;
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

    const dBondPrice = applySwapDiscountThisCycle
      ? new Decimal(nominalValue).minus(rebuyDiscount)
      : new Decimal(nominalValue);
    
    // Investment for THIS cycle = cash from previous cycle + any leftovers
    const totalAvailable = currentInitialInvestment.plus(leftoverCash);
    const rolloverParams = calculateRollover(totalAvailable, dBondPrice);
    
    leftoverCash = rolloverParams.leftoverCash;
    const numberOfBonds = rolloverParams.numberOfBonds;
    
    const nominalStartingValue = numberOfBonds.times(nominalValue);

    let currentNominalValue = new Decimal(nominalStartingValue);
    let totalInterestEarnedSoFar = new Decimal(0);
    let periodicTaxPaidSoFar = new Decimal(0);

    const periods = generateCyclePeriods(currentPurchaseDate, cycleMaturityDate, actualCycleEndDate, payoutFrequency);

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

      const { value: lagInflation, isProjected: isInflationProjected } = getHistoricalValue(period.startDate, 'inflation', 2, historicalData);
      const { value: lagNbp, isProjected: isNbpProjected } = getHistoricalValue(period.startDate, 'nbpRate', 0, historicalData);

      const inflationResetYearIndex = Math.max(0, periodYearIndex - 1);
      const customInfValue = inputs.customInflation?.[inflationResetYearIndex];
      const customNbpVal = inputs.customNbpRate?.[periodYearIndex];

      const currentInterestRate = determineInterestRate(
        bondType,
        monthsIntoCycle,
        firstYearRate,
        activeExpectedInflation,
        expectedNbpRate,
        margin,
        isInflationIndexed,
        lagInflation,
        lagNbp,
        customInfValue,
        customNbpVal
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
          usedProjectedRate = customNbpVal !== undefined || isNbpProjected;
          rateSource = customNbpVal !== undefined
            ? 'projected_nbp'
            : lagNbp !== undefined
              ? 'historical_nbp'
              : 'projected_nbp';
          rateReferenceValue = customNbpVal ?? (lagNbp !== undefined ? lagNbp : expectedNbpRate);
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
          usedProjectedRate = customInfValue !== undefined || isInflationProjected;
          rateSource = customInfValue !== undefined
            ? 'projected_cpi'
            : lagInflation !== undefined
              ? 'historical_cpi_lag'
              : 'projected_cpi';
          rateReferenceValue = customInfValue ?? (lagInflation !== undefined ? lagInflation : activeExpectedInflation);
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
          taxDeducted = calculateTaxAmount(interestEarned, taxStrategy, true, taxRate);
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

      const hypotheticalEarlyExitFee = period.isMaturity
        ? new Decimal(0)
        : calculateEarlyWithdrawalFee(
            bondType,
            true,
            true,
            totalInterestEarnedSoFar,
            numberOfBonds,
            earlyWithdrawalFee,
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
            taxRate,
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
      const hypotheticalEarlyExitValue = currentGrossValue
        .minus(hypotheticalEarlyExitFee)
        .minus(currentTaxAtPoint);
      const totalValue = liquidationValue.plus(leftoverCash);
      const realValue = calculateRealValue(totalValue, cumulativeInflation);
      const checkpointNetProfit = totalValue.minus(initialInvestment);

      globalTimeline.push({
        year: totalMonthsSoFar / 12,
        periodLabel: period.periodLabel,
        cycleIndex,
        cycleStartDate: currentPurchaseDate.toISOString(),
        cycleEndDate: period.endDate.toISOString(),
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
        netProfit: checkpointNetProfit.toNumber(),
        earlyWithdrawalValue: Decimal.max(hypotheticalEarlyExitValue, 0).toNumber(),
        cumulativeInflation: cumulativeInflation.toNumber(),
        isMaturity: period.isMaturity,
        isWithdrawal: period.endDate.getTime() === targetWithdrawalDate.getTime(),
        isProjected: rateSource === 'projected_cpi' || rateSource === 'projected_nbp',
        inflationReference: customInfValue ?? (lagInflation !== undefined ? lagInflation : activeExpectedInflation),
        nbpReference: customNbpVal ?? (lagNbp !== undefined ? lagNbp : expectedNbpRate),
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
          taxRate,
        );
    
    totalTaxAcc = totalTaxAcc.plus(cycleTax);
    totalFeeAcc = totalFeeAcc.plus(cycleFee);

    const netProceeds = cycleGrossValue.minus(cycleFee).minus(cycleTax).plus(leftoverCash);

    if (!rollover || isEarlyWithdrawal || actualCycleEndDate.getTime() === targetWithdrawalDate.getTime()) {
      const totalHorizonYears = differenceInDays(actualCycleEndDate, startDate) / 365.25;
      if (rollover) calculationNotes.push(`Simulation covered ${cycleIndex} bond cycle${cycleIndex === 1 ? '' : 's'} across the selected horizon.`);
      else calculationNotes.push('Rollover is disabled; the simulation stops at the first bond cycle or selected withdrawal date.');
      if (isEarlyWithdrawal) calculationNotes.push('Early redemption fee logic was applied before the native maturity date.');

      return createFinalSingleBondResult({
        initialInvestment,
        timeline: globalTimeline,
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
    leftoverCash = new Decimal(0);
    globalAccumulatedNetInterest = new Decimal(0);
    currentPurchaseDate = actualCycleEndDate;
    applySwapDiscountThisCycle = isRebought;
    cycleIndex += 1;
  }

  throw createNumericFaultError('Single-bond calculation exited without reaching the selected withdrawal date.', {
    details: {
      purchaseDate: startDate.toISOString(),
      withdrawalDate: targetWithdrawalDate.toISOString(),
      timelineLength: globalTimeline.length,
      cycleIndex,
    },
  });
});
