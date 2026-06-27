import { Decimal } from 'decimal.js';

import { BOND_DEFINITIONS } from '../../constants/bond-definitions';
import { BondType, InvestmentFrequency } from '../../types';

import { getRegularInvestmentInterval } from './regular-investment-schedule';

export function resolveRegularInvestmentBondSetup({
  bondType,
  duration,
  frequency,
  isRebought,
  rebuyDiscount,
}: {
  bondType: BondType;
  duration?: number;
  frequency: InvestmentFrequency;
  isRebought: boolean;
  rebuyDiscount: number;
}) {
  const bondDef = BOND_DEFINITIONS[bondType];
  const nominalValue = bondDef?.nominalValue ?? 100;

  return {
    bondDef,
    nominalValue,
    bondDuration: bondType === BondType.OTS ? 0.25 : duration || bondDef.duration,
    interval: getRegularInvestmentInterval(frequency),
    bondPrice: isRebought
      ? new Decimal(nominalValue).minus(rebuyDiscount)
      : new Decimal(nominalValue),
  };
}

export function shouldCreateRegularInvestmentLot({
  monthIndex,
  interval,
  totalMonths,
}: {
  monthIndex: number;
  interval: number;
  totalMonths: number;
}) {
  return monthIndex % interval === 0 && monthIndex < totalMonths;
}

export function resolveRegularInvestmentPurchaseCash({
  contributionAmount,
  maturedLiquidity,
  rolloverEnabled,
}: {
  contributionAmount: number;
  maturedLiquidity: Decimal;
  rolloverEnabled: boolean;
}) {
  const contribution = new Decimal(contributionAmount);

  return rolloverEnabled ? contribution.plus(maturedLiquidity) : contribution;
}
