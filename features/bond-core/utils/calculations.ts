import {
  BondInputs,
  BondType,
  CalculationResult,
  RegularInvestmentInputs,
  RegularInvestmentResult,
  InvestmentFrequency,
  RegularTimelinePoint,
  LotBreakdown,
  TaxStrategy
} from '../types';
import { SimulationEventType, SimulationEvent } from '../types/simulation';
import { BOND_DEFINITIONS } from '../constants/bond-definitions';
import { addMonths, differenceInDays, differenceInMonths, getDaysInYear, isAfter, isBefore, parseISO } from 'date-fns';
import { Decimal } from 'decimal.js';

// Engine imports
import { determineInterestRate } from './engine/rate-resolution';
import { calculateBondInvestment } from './engine/single-bond-engine';
export { calculateBondInvestment };
import { calculateTaxAmount, shouldWithholdPeriodicTax } from './engine/tax-settlement';
import { calculateEarlyWithdrawalFee } from './engine/redemption';
import { getHistoricalValue } from './engine/historical-data';
import { getExpectedInflationForYearIndex } from './engine/inflation';
import { createRegularInvestmentResult } from './engine/result-assembly';
import { normalizeRegularInvestmentInputs } from './engine/input-normalization';
import { calculatePeriodAccrual } from './engine/accrual';
import { calculateRollover } from './engine/rollover';
import { calculateRealValue } from './engine/real-return';
import { generateCyclePeriods } from './engine/timeline-builder';
import { createNumericFaultError } from '../errors';

/**
 * Configures Decimal for financial precision.
 */
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

import { withMathGuard } from './engine-guards';

function assertSingleBondTerminalResult(
  result: CalculationResult | null | undefined,
  context: string,
): asserts result is CalculationResult {
  if (!result) {
    throw createNumericFaultError(`${context}: calculation did not produce a terminal result.`);
  }

  if (!Array.isArray(result.timeline) || result.timeline.length < 2) {
    throw createNumericFaultError(`${context}: calculation produced an incomplete timeline.`, {
      details: {
        timelineLength: Array.isArray(result.timeline) ? result.timeline.length : 'missing',
      },
    });
  }

  const finalPoint = result.timeline[result.timeline.length - 1];
  if (!finalPoint?.isWithdrawal) {
    throw createNumericFaultError(`${context}: final timeline point is not a withdrawal checkpoint.`, {
      details: {
        finalPeriodLabel: finalPoint?.periodLabel,
        finalCycleEndDate: finalPoint?.cycleEndDate,
      },
    });
  }

  if (!Number.isFinite(result.netPayoutValue) || !Number.isFinite(result.finalRealValue)) {
    throw createNumericFaultError(`${context}: terminal payout values are not finite.`, {
      details: {
        netPayoutValue: String(result.netPayoutValue),
        finalRealValue: String(result.finalRealValue),
      },
    });
  }
}

/**
 * Reverse calculation to find the required initial investment to reach a target net sum.
 * Uses a binary search approach.
 */
export function calculateReverseBondInvestment(inputs: BondInputs & { targetNetSum: number }): CalculationResult {
  let low = 100;
  let high = 10_000_000;
  let result: CalculationResult | null = null;
  
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

  let finalInitialInvestment = Math.ceil(high / 100) * 100;
  result = calculateBondInvestment({ ...inputs, initialInvestment: finalInitialInvestment });

  while (result.netPayoutValue < inputs.targetNetSum && finalInitialInvestment < 100_000_000) {
    finalInitialInvestment += 100;
    result = calculateBondInvestment({ ...inputs, initialInvestment: finalInitialInvestment });
  }

  assertSingleBondTerminalResult(result, 'Reverse bond calculation');

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
export const calculateRegularInvestment = withMathGuard(function calculateRegularInvestment(inputs: RegularInvestmentInputs): RegularInvestmentResult {
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
    taxStrategy,
    taxRate,
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
    const { value: currentLagNbp } = getHistoricalValue(currentMonthDate, 'nbpRate', 0, historicalData);

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
          const globalMonthIndex = Math.max(0, differenceInMonths(currentMonthDate, startPurchaseDate));
          const globalYearIndex = Math.floor(globalMonthIndex / 12);
          const inflationResetYearIndex = Math.max(0, globalYearIndex - 1);
          const projectedInflation = getExpectedInflationForYearIndex(
            expectedInflation,
            inputs.customInflation,
            inflationResetYearIndex,
          );
          const customInflationValue = inputs.customInflation?.[inflationResetYearIndex];
          const customNbpValue = inputs.customNbpRate?.[globalYearIndex];
          const currentInterestRate = determineInterestRate(
            bondType,
            monthIndex,
            firstYearRate,
            projectedInflation,
            expectedNbpRate,
            margin,
            bondDef.isInflationIndexed,
            currentLagInflation,
            currentLagNbp,
            customInflationValue,
            customNbpValue,
          );
          const currentMonthlyRate = currentInterestRate.dividedBy(12).dividedBy(100);

          const interestThisMonth = dLotGrossValue.times(currentMonthlyRate);
          const newAccumulatedInterest = dLotAccumulatedInterest.plus(interestThisMonth);
          lot.accumulatedInterest = newAccumulatedInterest.toNumber();

          if (isCapitalized) {
            lot.grossValue = dLotGrossValue.plus(interestThisMonth).toNumber();
          } else {
            if (shouldWithholdTaxForLot) {
              const taxThisMonth = calculateTaxAmount(interestThisMonth, taxStrategy, false, taxRate);
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
              taxRate,
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

    if (isWithdrawalStep) break;
  }

  return createRegularInvestmentResult(totalInvested, investmentHorizonMonths / 12, timeline, lots);
});
