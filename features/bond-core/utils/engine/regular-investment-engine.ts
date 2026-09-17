import { addMonths, differenceInMonths, format, isAfter, isEqual } from 'date-fns';
import { Decimal } from 'decimal.js';

import {
  LotBreakdown,
  RegularInvestmentInputs,
  RegularInvestmentResult,
  RegularTimelinePoint,
} from '../../types';
import { SimulationEvent, SimulationEventType } from '../../types/simulation';
import { withMathGuard } from '../engine-guards';

import { getHistoricalValue } from './historical-data';
import { normalizeRegularInvestmentInputs } from './input-normalization';
import { priceIndexPathForProjection } from './price-index';
import { calculateRealValue } from './real-return';
import {
  summarizeRegularInvestmentLots,
  updateRegularInvestmentLotsForMonth,
} from './regular-investment-lots';
import { resolveRegularInvestmentBondSetup } from './regular-investment-orchestration';
import { createRegularInvestmentLot, settleMaturedLots } from './regular-investment-schedule';
import { createRegularInvestmentResult } from './result-assembly';

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
    redemptionFeeCap,
    isCapitalized,
    purchaseDate: startPurchaseDate,
    withdrawalDate: targetWithdrawalDate,
    isRebought,
    rebuyDiscount,
    historicalData,
    taxStrategy,
    taxRate,
    rollover = false,
  } = normalizedInputs;

  const {
    bondDef,
    nominalValue: bondNominalValue,
    bondDuration,
    interval,
    bondPrice,
  } = resolveRegularInvestmentBondSetup({
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
  let realContributions = new Decimal(0);
  let cumulativeInflation = new Decimal(1);
  let cashBalance = new Decimal(0);
  let terminalNetSettlement: Decimal | undefined;

  // The terminal settlement is a financial event, not a rendering cadence.
  // Keep cadence dates before it and append the exact selected date once.
  const eventDates: Date[] = [];
  for (let month = 0; month <= totalMonths; month += 1) {
    const date = addMonths(startPurchaseDate, month);
    if (isAfter(date, targetWithdrawalDate)) break;
    eventDates.push(date);
  }
  if (!eventDates.some((date) => isEqual(date, targetWithdrawalDate))) {
    eventDates.push(targetWithdrawalDate);
  }
  const priceIndexPath = priceIndexPathForProjection(
    startPurchaseDate,
    expectedInflation,
    inputs.customInflation,
  );

  for (const currentMonthDate of eventDates) {
    const m = Math.max(0, differenceInMonths(currentMonthDate, startPurchaseDate));
    const events: SimulationEvent[] = [];

    // Recompute from the date-only anchor so an off-cadence terminal event
    // includes its partial month; this is the same price-index path used by
    // the single-bond engine.
    cumulativeInflation = priceIndexPath.factorBetween(startPurchaseDate, currentMonthDate);

    const isWithdrawalStep = currentMonthDate.getTime() === targetWithdrawalDate.getTime();

    const isContributionStep =
      m < totalMonths &&
      m % interval === 0 &&
      isEqual(currentMonthDate, addMonths(startPurchaseDate, m));
    if (isContributionStep) {
      // Contributions are external cash even when they cannot yet purchase a
      // whole bond. This is the conservation identity for the simulation.
      totalInvested = totalInvested.plus(contributionAmount);
      // Contributions arrive at different price levels. Convert each one to
      // the start-date purchasing-power basis before deriving real returns.
      realContributions = realContributions.plus(
        priceIndexPath.deflate(contributionAmount, startPurchaseDate, currentMonthDate),
      );
      cashBalance = cashBalance.plus(contributionAmount);
      const totalAvailableForPurchase = rollover
        ? cashBalance
        : Decimal.min(cashBalance, new Decimal(contributionAmount));

      const { lot, investedAmount, units } = createRegularInvestmentLot({
        currentMonthDate,
        bondType,
        bondDuration,
        nominalValue: bondNominalValue,
        bondPrice,
        availableCash: totalAvailableForPurchase,
      });

      if (lot) {
        lots.push(lot);
        cashBalance = cashBalance.minus(investedAmount);
        events.push({
          type: SimulationEventType.PURCHASE,
          date: format(currentMonthDate, 'yyyy-MM-dd'),
          description: `Purchased ${units.toNumber()} bonds`,
          value: investedAmount.toNumber(),
        });
      }
    }

    // Pre-calculate rates for this month to avoid N*H lookups.
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

    updateRegularInvestmentLotsForMonth({
      lots,
      currentMonthDate,
      startPurchaseDate,
      bondDuration,
      bondType,
      firstYearRate,
      expectedInflation,
      expectedNbpRate,
      margin,
      isInflationIndexed: bondDef.isInflationIndexed,
      currentLagInflation,
      currentLagNbp,
      customInflation: inputs.customInflation,
      customNbpRate: inputs.customNbpRate,
      isCapitalized,
      taxStrategy,
      taxRate,
      bondPrice,
      nominalValue: bondNominalValue,
      earlyWithdrawalFee,
      redemptionFeeCap,
    });

    // Move mature proceeds out of active holdings only after their final
    // period has accrued. A settled lot remains in history, but never again
    // contributes to the active holding summary.
    const maturedLiquidity = settleMaturedLots(lots, currentMonthDate, events);
    cashBalance = cashBalance.plus(maturedLiquidity);

    const currentLotSummary = summarizeRegularInvestmentLots({
      lots,
      bondPrice,
      nominalValue: bondNominalValue,
      isCapitalized,
    });

    const totalTax = lots.reduce((sum, lot) => sum.plus(lot.tax), new Decimal(0));
    const totalFees = lots.reduce((sum, lot) => sum.plus(lot.earlyWithdrawalFee), new Decimal(0));
    if (isWithdrawalStep) {
      const terminalSettlement = cashBalance
        .plus(currentLotSummary.nominalValue)
        .minus(currentLotSummary.tax)
        .minus(currentLotSummary.fees);
      events.push({
        type: SimulationEventType.WITHDRAWAL,
        date: format(currentMonthDate, 'yyyy-MM-dd'),
        description: `Final withdrawal of all lots`,
        value: terminalSettlement.toNumber(),
      });
      terminalNetSettlement = terminalSettlement;
      cashBalance = new Decimal(0);
    }

    const nominalValue = terminalNetSettlement ?? currentLotSummary.nominalValue.plus(cashBalance);
    const profit = nominalValue.minus(totalInvested);

    timeline.push({
      month: m,
      date: format(currentMonthDate, 'yyyy-MM-dd'),
      totalInvested: totalInvested.toNumber(),
      nominalValue: nominalValue.toNumber(),
      realValue: calculateRealValue(nominalValue, cumulativeInflation).toNumber(),
      profit: profit.toNumber(),
      tax: totalTax.toNumber(),
      earlyWithdrawalFees: totalFees.toNumber(),
      isProjected: currentIsProjected,
      cashBalance: cashBalance.toNumber(),
      events: events.length > 0 ? events : undefined,
    });

    if (isWithdrawalStep) break;
  }

  const last = timeline.at(-1);
  return createRegularInvestmentResult(
    totalInvested,
    investmentHorizonMonths / 12,
    timeline,
    lots,
    realContributions,
    cashBalance,
    terminalNetSettlement
      ? new Decimal(0)
      : new Decimal(last?.nominalValue ?? 0).minus(cashBalance),
  );
});
