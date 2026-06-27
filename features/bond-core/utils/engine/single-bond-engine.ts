import { differenceInDays, differenceInMonths, isBefore } from 'date-fns';
import { Decimal } from 'decimal.js';

import { BOND_DEFINITIONS } from '../../constants/bond-definitions';
import { createNumericFaultError } from '../../errors';
import { BondInputs, CalculationResult, TaxStrategy, YearlyTimelinePoint } from '../../types';
import { SimulationEvent, SimulationEventType } from '../../types/simulation';
import { withMathGuard } from '../engine-guards';

import { calculatePeriodAccrual } from './accrual';
import { getHistoricalValue } from './historical-data';
import { calculateCumulativeInflation, getExpectedInflationForYearIndex } from './inflation';
import { normalizeBondInputs } from './input-normalization';
import { resolveSingleBondRateContext } from './rate-context';
import { createFinalSingleBondResult, createInitialTimelinePoint } from './result-assembly';
import { resolveSingleBondCheckpointValues } from './single-bond-accounting';
import {
  createSingleBondCheckpoint,
  resolveSingleBondCycleSettlement,
} from './single-bond-checkpoint';
import { resolveSingleBondCycleDates, resolveSingleBondCycleInvestment } from './single-bond-cycle';
import {
  createCyclePurchaseEvent,
  createEarlyRedemptionFeeEvent,
  createFinalTaxSettlementEvent,
  createInterestAccrualEvent,
  createMaturityEvent,
  createPayoutEvent,
  createPeriodicTaxSettlementEvent,
  createRateResetEvent,
  createWithdrawalEvent,
} from './single-bond-events';
import { applySingleBondTaxRelief } from './single-bond-tax-relief';
import {
  buildSingleBondTerminalNotes,
  shouldStopSingleBondSimulation,
} from './single-bond-terminal';
import { calculateTaxAmount, shouldWithholdPeriodicTax } from './tax-settlement';
import { generateCyclePeriods } from './timeline-builder';

/**
 * Standard calculation for a single bond investment.
 * Supports "rollover" (re-investing at maturity) for multi-year comparisons.
 */
export const calculateBondInvestment = withMathGuard(function calculateBondInvestment(
  inputs: BondInputs & { rollover?: boolean },
): CalculationResult {
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

  const taxRelief = applySingleBondTaxRelief({
    initialInvestment,
    taxStrategy,
    ikzeTaxBracket,
  });
  let currentInitialInvestment = taxRelief.currentInitialInvestment;
  const calculationNotes: string[] = [...taxRelief.calculationNotes];

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
  initialPoint.events = [
    {
      type: SimulationEventType.PURCHASE,
      date: startDate.toISOString(),
      description: `Initial investment of ${initialInvestment} PLN`,
      value: initialInvestment,
    },
  ];
  globalTimeline.push(initialPoint);

  // We loop until we cover the whole simulation period (supporting multiple rollovers)
  while (isBefore(currentPurchaseDate, targetWithdrawalDate)) {
    const bondDef = BOND_DEFINITIONS[bondType];
    const isInflationIndexed = bondDef?.isInflationIndexed ?? false;
    const nominalValue = bondDef?.nominalValue ?? 100;

    const { cycleMaturityDate, actualCycleEndDate, isEarlyWithdrawal } =
      resolveSingleBondCycleDates({
        purchaseDate: currentPurchaseDate,
        bondDuration,
        targetWithdrawalDate,
      });

    // Investment for THIS cycle = cash from previous cycle + any leftovers
    const totalAvailable = currentInitialInvestment.plus(leftoverCash);
    const cycleInvestment = resolveSingleBondCycleInvestment({
      availableCash: totalAvailable,
      nominalValue,
      rebuyDiscount,
      applySwapDiscountThisCycle,
    });
    leftoverCash = cycleInvestment.leftoverCash;
    const numberOfBonds = cycleInvestment.numberOfBonds;
    const nominalStartingValue = cycleInvestment.nominalStartingValue;

    let currentNominalValue = new Decimal(nominalStartingValue);
    let totalInterestEarnedSoFar = new Decimal(0);
    let periodicTaxPaidSoFar = new Decimal(0);

    const periods = generateCyclePeriods(
      currentPurchaseDate,
      cycleMaturityDate,
      actualCycleEndDate,
      payoutFrequency,
    );

    for (let i = 0; i < periods.length; i++) {
      const period = periods[i];
      const events: SimulationEvent[] = [];
      const monthsIntoCycle = differenceInMonths(period.startDate, currentPurchaseDate);

      if (i === 0) {
        events.push(
          createCyclePurchaseEvent({
            cycleIndex,
            date: period.startDate,
            numberOfBonds,
            nominalStartingValue,
          }),
        );
      }

      const periodYearIndex = Math.floor(differenceInMonths(period.startDate, startDate) / 12);
      const activeExpectedInflation = getExpectedInflationForYearIndex(
        expectedInflation,
        inputs.customInflation,
        periodYearIndex,
      );

      const { value: lagInflation, isProjected: isInflationProjected } = getHistoricalValue(
        period.startDate,
        'inflation',
        2,
        historicalData,
      );
      const { value: lagNbp, isProjected: isNbpProjected } = getHistoricalValue(
        period.startDate,
        'nbpRate',
        0,
        historicalData,
      );

      const inflationResetYearIndex = Math.max(0, periodYearIndex - 1);
      const customInfValue = inputs.customInflation?.[inflationResetYearIndex];
      const customNbpVal = inputs.customNbpRate?.[periodYearIndex];

      const rateContext = resolveSingleBondRateContext({
        bondType,
        monthsIntoCycle,
        firstYearRate,
        activeExpectedInflation,
        expectedNbpRate,
        margin,
        isInflationIndexed,
        lagInflation,
        lagNbp,
        customInflationValue: customInfValue,
        customNbpValue: customNbpVal,
        isInflationProjected,
        isNbpProjected,
      });
      const {
        currentInterestRate,
        rateSource,
        rateReferenceValue,
        rateMarginApplied,
        usedProjectedRate,
      } = rateContext;

      if (rateContext.shouldRecordRateReset && rateContext.rateResetDescription) {
        events.push(
          createRateResetEvent(
            period.startDate,
            rateContext.rateResetDescription,
            currentInterestRate,
          ),
        );
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
        period.startDate,
      );

      const interestEarned = accrual.interestEarned;
      const previousNominalValue = new Decimal(currentNominalValue);
      totalInterestEarnedSoFar = totalInterestEarnedSoFar.plus(interestEarned);

      if (interestEarned.gt(0)) {
        events.push(createInterestAccrualEvent(period.endDate, interestEarned));
      }

      let taxDeducted = new Decimal(0);
      if (shouldWithholdPeriodicTax(taxStrategy, isCapitalized)) {
        if (!period.isWithdrawal || !isEarlyWithdrawal) {
          taxDeducted = calculateTaxAmount(interestEarned, taxStrategy, true, taxRate);
          periodicTaxPaidSoFar = periodicTaxPaidSoFar.plus(taxDeducted);
          if (taxDeducted.gt(0)) {
            events.push(createPeriodicTaxSettlementEvent(period.endDate, taxDeducted));
            events.push(createPayoutEvent(period.endDate, interestEarned.minus(taxDeducted)));
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
        startDate,
      );

      const checkpointValues = resolveSingleBondCheckpointValues({
        bondType,
        isEarlyWithdrawal,
        isWithdrawal: period.isWithdrawal,
        isMaturity: period.isMaturity,
        totalInterestEarnedSoFar,
        numberOfBonds,
        earlyWithdrawalFee,
        isCapitalized,
        currentNominalValue,
        nominalStartingValue,
        taxStrategy,
        taxRate,
        periodicTaxPaidSoFar,
        cumulativeInflation,
        initialInvestment,
        leftoverCash,
      });

      if (period.isWithdrawal && isEarlyWithdrawal && checkpointValues.currentWithdrawalFee.gt(0)) {
        events.push(
          createEarlyRedemptionFeeEvent(period.endDate, checkpointValues.currentWithdrawalFee),
        );
      }

      if (
        period.isWithdrawal &&
        !shouldWithholdPeriodicTax(taxStrategy, isCapitalized) &&
        checkpointValues.currentTaxAtPoint.gt(0)
      ) {
        events.push(
          createFinalTaxSettlementEvent(period.endDate, checkpointValues.currentTaxAtPoint),
        );
      }

      if (period.isMaturity) {
        events.push(createMaturityEvent(period.endDate));
      }

      if (period.isWithdrawal) {
        events.push(
          createWithdrawalEvent(
            period.endDate,
            checkpointValues.currentGrossValue
              .minus(checkpointValues.currentWithdrawalFee)
              .minus(checkpointValues.currentTaxAtPoint),
          ),
        );
      }

      globalTimeline.push(
        createSingleBondCheckpoint({
          totalMonthsSoFar,
          periodLabel: period.periodLabel,
          cycleIndex,
          cycleStartDate: currentPurchaseDate,
          periodEndDate: period.endDate,
          currentInterestRate,
          rateSource,
          rateReferenceValue,
          rateMarginApplied,
          usedProjectedRate,
          previousNominalValue,
          interestEarned,
          taxDeducted,
          netInterest,
          currentNominalPrincipal: checkpointValues.currentNominalPrincipal,
          globalAccumulatedNetInterest,
          totalValue: checkpointValues.totalValue,
          realValue: checkpointValues.realValue,
          checkpointNetProfit: checkpointValues.checkpointNetProfit,
          hypotheticalEarlyExitValue: checkpointValues.hypotheticalEarlyExitValue,
          cumulativeInflation,
          isMaturity: period.isMaturity,
          isWithdrawal: period.endDate.getTime() === targetWithdrawalDate.getTime(),
          inflationReference:
            customInfValue ?? (lagInflation !== undefined ? lagInflation : activeExpectedInflation),
          nbpReference: customNbpVal ?? (lagNbp !== undefined ? lagNbp : expectedNbpRate),
          events,
        }),
      );

      if (period.isWithdrawal) break;
    }

    const { cycleFee, cycleTax, netProceeds } = resolveSingleBondCycleSettlement({
      bondType,
      isEarlyWithdrawal,
      totalInterestEarnedSoFar,
      numberOfBonds,
      earlyWithdrawalFee,
      isCapitalized,
      currentNominalValue,
      nominalStartingValue,
      taxStrategy,
      taxRate,
      periodicTaxPaidSoFar,
      leftoverCash,
    });

    totalTaxAcc = totalTaxAcc.plus(cycleTax);
    totalFeeAcc = totalFeeAcc.plus(cycleFee);

    if (
      shouldStopSingleBondSimulation({
        rollover,
        isEarlyWithdrawal,
        actualCycleEndDate,
        targetWithdrawalDate,
      })
    ) {
      const totalHorizonYears = differenceInDays(actualCycleEndDate, startDate) / 365.25;
      calculationNotes.push(
        ...buildSingleBondTerminalNotes({
          rollover,
          cycleIndex,
          isEarlyWithdrawal,
        }),
      );

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

  throw createNumericFaultError(
    'Single-bond calculation exited without reaching the selected withdrawal date.',
    {
      details: {
        purchaseDate: startDate.toISOString(),
        withdrawalDate: targetWithdrawalDate.toISOString(),
        timelineLength: globalTimeline.length,
        cycleIndex,
      },
    },
  );
});
