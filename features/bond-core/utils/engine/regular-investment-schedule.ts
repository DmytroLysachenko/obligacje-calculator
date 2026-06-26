import { addMonths, differenceInDays, getDaysInYear, isAfter, parseISO } from 'date-fns';
import { Decimal } from 'decimal.js';

import { BondType, InvestmentFrequency, LotBreakdown, RegularInvestmentInputs } from '../../types';
import { SimulationEvent, SimulationEventType } from '../../types/simulation';

import { getExpectedInflationForYearIndex } from './inflation';

export function getRegularInvestmentInterval(frequency: InvestmentFrequency) {
  if (frequency === InvestmentFrequency.MONTHLY) {
    return 1;
  }
  return frequency === InvestmentFrequency.QUARTERLY ? 3 : 12;
}

interface AdvanceRegularInvestmentInflationInput {
  currentInflation: Decimal;
  monthIndex: number;
  purchaseDate: Date;
  expectedInflation: number;
  customInflation?: RegularInvestmentInputs['customInflation'];
}

export function advanceRegularInvestmentInflation({
  currentInflation,
  monthIndex,
  purchaseDate,
  expectedInflation,
  customInflation,
}: AdvanceRegularInvestmentInflationInput) {
  if (monthIndex <= 0) {
    return currentInflation;
  }

  const currentMonthDate = addMonths(purchaseDate, monthIndex);
  const previousMonthDate = addMonths(purchaseDate, monthIndex - 1);
  const daysInMonth = differenceInDays(currentMonthDate, previousMonthDate);
  const daysInYear = getDaysInYear(previousMonthDate);
  const yearIndex = Math.floor((monthIndex - 1) / 12);
  const annualInflation = getExpectedInflationForYearIndex(
    expectedInflation,
    customInflation,
    yearIndex,
  );
  const monthlyFactor = new Decimal(annualInflation)
    .dividedBy(100)
    .times(daysInMonth)
    .dividedBy(daysInYear);

  return currentInflation.times(new Decimal(1).plus(monthlyFactor));
}

export function settleMaturedLots(
  lots: LotBreakdown[],
  currentMonthDate: Date,
  events: SimulationEvent[],
) {
  let maturedLiquidity = new Decimal(0);

  lots.forEach((lot) => {
    const lotMaturityDate = parseISO(lot.maturityDate);
    if (
      !lot.isMatured &&
      (currentMonthDate.getTime() === lotMaturityDate.getTime() ||
        isAfter(currentMonthDate, lotMaturityDate))
    ) {
      lot.isMatured = true;
      maturedLiquidity = maturedLiquidity.plus(lot.netValue);
      events.push({
        type: SimulationEventType.MATURITY,
        date: currentMonthDate.toISOString(),
        description: `Lot from ${lot.purchaseDate} matured`,
        value: lot.netValue,
      });
    }
  });

  return maturedLiquidity;
}

interface CreateRegularInvestmentLotInput {
  currentMonthDate: Date;
  bondType: BondType;
  bondDuration: number;
  nominalValue: number;
  bondPrice: Decimal;
  availableCash: Decimal;
}

export function createRegularInvestmentLot({
  currentMonthDate,
  bondType,
  bondDuration,
  nominalValue,
  bondPrice,
  availableCash,
}: CreateRegularInvestmentLotInput) {
  const units = availableCash.dividedBy(bondPrice).floor();
  const investedAmount = units.times(bondPrice);
  const nominalAmount = units.times(nominalValue);

  if (!units.gt(0)) {
    return { lot: null, investedAmount, units };
  }

  const lotDuration = bondType === BondType.OTS ? 0.25 : bondDuration;
  const lotMaturityDate = addMonths(currentMonthDate, Math.round(lotDuration * 12));

  return {
    units,
    investedAmount,
    lot: {
      purchaseDate: currentMonthDate.toISOString(),
      maturityDate: lotMaturityDate.toISOString(),
      isMatured: false,
      investedAmount: investedAmount.toNumber(),
      accumulatedInterest: 0,
      tax: 0,
      earlyWithdrawalFee: 0,
      grossValue: nominalAmount.toNumber(),
      netValue: nominalAmount.toNumber(),
    } satisfies LotBreakdown,
  };
}
