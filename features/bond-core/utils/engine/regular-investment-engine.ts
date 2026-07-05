import { addMonths, isAfter } from 'date-fns';
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
import { calculateRealValue } from './real-return';
import {
  summarizeRegularInvestmentLots,
  updateRegularInvestmentLotsForMonth,
} from './regular-investment-lots';
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
      nominalValue,
      earlyWithdrawalFee,
      isWithdrawalStep,
    });

    const currentLotSummary = summarizeRegularInvestmentLots({
      lots,
      bondPrice,
      nominalValue,
      isCapitalized,
    });

    if (isWithdrawalStep) {
      events.push({
        type: SimulationEventType.WITHDRAWAL,
        date: currentMonthDate.toISOString(),
        description: `Final withdrawal of all lots`,
        value: currentLotSummary.nominalValue
          .minus(currentLotSummary.tax)
          .minus(currentLotSummary.fees)
          .toNumber(),
      });
    }

    timeline.push({
      month: m,
      date: currentMonthDate.toISOString(),
      totalInvested: totalInvested.toNumber(),
      nominalValue: currentLotSummary.nominalValue.toNumber(),
      realValue: calculateRealValue(currentLotSummary.nominalValue, cumulativeInflation).toNumber(),
      profit: currentLotSummary.profit.toNumber(),
      tax: currentLotSummary.tax.toNumber(),
      earlyWithdrawalFees: currentLotSummary.fees.toNumber(),
      isProjected: currentIsProjected,
      events: events.length > 0 ? events : undefined,
    });

    if (isWithdrawalStep) break;
  }

  return createRegularInvestmentResult(totalInvested, investmentHorizonMonths / 12, timeline, lots);
});
