import { addMonths, differenceInMonths, isAfter, isBefore, parseISO } from 'date-fns';
import { Decimal } from 'decimal.js';

import {
  LotBreakdown,
  RegularInvestmentInputs,
  RegularInvestmentResult,
  RegularTimelinePoint,
  TaxStrategy,
} from '../../types';
import { SimulationEvent, SimulationEventType } from '../../types/simulation';
import { withMathGuard } from '../engine-guards';

import { getHistoricalValue } from './historical-data';
import { getExpectedInflationForYearIndex } from './inflation';
import { normalizeRegularInvestmentInputs } from './input-normalization';
import { determineInterestRate } from './rate-resolution';
import { calculateRealValue } from './real-return';
import { calculateEarlyWithdrawalFee } from './redemption';
import {
  resolveRegularInvestmentBondSetup,
  resolveRegularInvestmentPurchaseCash,
  shouldCreateRegularInvestmentLot,
} from './regular-investment-orchestration';
import {
  advanceRegularInvestmentInflation,
  createRegularInvestmentLot,
  settleMaturedLots,
} from './regular-investment-schedule';
import { createRegularInvestmentResult } from './result-assembly';
import { calculateTaxAmount, shouldWithholdPeriodicTax } from './tax-settlement';

/**
 * Regular investment calculator using modular engine.
 */
export const calculateRegularInvestment = withMathGuard(function calculateRegularInvestment(
  inputs: RegularInvestmentInputs,
): RegularInvestmentResult {
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

  const { bondDef, nominalValue, bondDuration, interval, bondPrice } =
    resolveRegularInvestmentBondSetup({
      bondType,
      duration: inputs.duration,
      frequency,
      isRebought,
      rebuyDiscount,
    });

  const totalMonths = investmentHorizonMonths;

  const lots: LotBreakdown[] = [];
  const timeline: RegularTimelinePoint[] = [];

  let totalInvested = new Decimal(0);
  let cumulativeInflation = new Decimal(1);

  // We loop month-by-month for simplicity in regular investment
  for (let m = 0; m <= totalMonths; m++) {
    const currentMonthDate = addMonths(startPurchaseDate, m);
    if (isAfter(currentMonthDate, targetWithdrawalDate)) break;
    const events: SimulationEvent[] = [];

    cumulativeInflation = advanceRegularInvestmentInflation({
      currentInflation: cumulativeInflation,
      monthIndex: m,
      purchaseDate: startPurchaseDate,
      expectedInflation,
      customInflation: inputs.customInflation,
    });

    const isWithdrawalStep = currentMonthDate.getTime() === targetWithdrawalDate.getTime();

    // 1. Handle matured lots and rollover capital
    const maturedLiquidity = settleMaturedLots(lots, currentMonthDate, events);

    // 2. Add new lot (Standard contribution + Matured liquidity if rollover enabled)
    if (shouldCreateRegularInvestmentLot({ monthIndex: m, interval, totalMonths })) {
      const rolloverEnabled = inputs.rollover ?? true; // Default to true for regular investment
      const totalAvailableForPurchase = resolveRegularInvestmentPurchaseCash({
        contributionAmount,
        maturedLiquidity,
        rolloverEnabled,
      });

      const { lot, investedAmount, units } = createRegularInvestmentLot({
        currentMonthDate,
        bondType,
        bondDuration,
        nominalValue,
        bondPrice,
        availableCash: totalAvailableForPurchase,
      });

      if (lot) {
        lots.push(lot);
        totalInvested = totalInvested.plus(contributionAmount);
        events.push({
          type: SimulationEventType.PURCHASE,
          date: currentMonthDate.toISOString(),
          description: `Purchased ${units.toNumber()} bonds`,
          value: investedAmount.toNumber(),
        });
      }
    }

    // 2. Pre-calculate rates for this month to avoid N*H lookups
    const { value: currentLagInflation, isProjected: currentIsProjected } = getHistoricalValue(
      currentMonthDate,
      'inflation',
      2,
      historicalData,
    );
    const { value: currentLagNbp } = getHistoricalValue(
      currentMonthDate,
      'nbpRate',
      0,
      historicalData,
    );

    // 3. Update all active lots
    lots.forEach((lot) => {
      const lotPurchaseDate = parseISO(lot.purchaseDate);
      const lotMaturityDate = parseISO(lot.maturityDate);

      if (isAfter(currentMonthDate, lotPurchaseDate)) {
        const monthsHeld = differenceInMonths(currentMonthDate, lotPurchaseDate);
        const bondDurationMonths = Math.round(bondDuration * 12);

        const dLotGrossValue = new Decimal(lot.grossValue);
        const dLotAccumulatedInterest = new Decimal(lot.accumulatedInterest);
        const dLotTax = new Decimal(lot.tax);
        const shouldWithholdTaxForLot = shouldWithholdPeriodicTax(taxStrategy, isCapitalized);

        if (monthsHeld <= bondDurationMonths) {
          const monthIndex = monthsHeld - 1;
          const globalMonthIndex = Math.max(
            0,
            differenceInMonths(currentMonthDate, startPurchaseDate),
          );
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
              const taxThisMonth = calculateTaxAmount(
                interestThisMonth,
                taxStrategy,
                false,
                taxRate,
              );
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
          earlyWithdrawalFee,
        );
        lot.earlyWithdrawalFee = dFinalFee.toNumber();

        const currentGrossValue = isCapitalized
          ? new Decimal(lot.grossValue)
          : units.times(nominalValue).plus(dFinalAccumulatedInterest);
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

    lots.forEach((lot) => {
      const units = new Decimal(lot.investedAmount).dividedBy(bondPrice).floor();
      const nominalStarting = units.times(nominalValue);
      currentNominalValueTotal = currentNominalValueTotal.plus(
        isCapitalized ? lot.grossValue : nominalStarting,
      );
      currentProfitTotal = currentProfitTotal.plus(
        new Decimal(lot.netValue).minus(lot.investedAmount),
      );
      currentTaxTotal = currentTaxTotal.plus(lot.tax);
      currentFeesTotal = currentFeesTotal.plus(lot.earlyWithdrawalFee);
    });

    if (isWithdrawalStep) {
      events.push({
        type: SimulationEventType.WITHDRAWAL,
        date: currentMonthDate.toISOString(),
        description: `Final withdrawal of all lots`,
        value: currentNominalValueTotal.minus(currentTaxTotal).minus(currentFeesTotal).toNumber(),
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
      events: events.length > 0 ? events : undefined,
    });

    if (isWithdrawalStep) break;
  }

  return createRegularInvestmentResult(totalInvested, investmentHorizonMonths / 12, timeline, lots);
});
