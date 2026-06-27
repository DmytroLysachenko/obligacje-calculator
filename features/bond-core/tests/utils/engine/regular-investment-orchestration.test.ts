import { Decimal } from 'decimal.js';
import { describe, expect, it } from 'vitest';

import { BondType, InvestmentFrequency } from '../../../types';
import {
  resolveRegularInvestmentBondSetup,
  resolveRegularInvestmentPurchaseCash,
  shouldCreateRegularInvestmentLot,
} from '../../../utils/engine/regular-investment-orchestration';

describe('regular investment orchestration helpers', () => {
  it('resolves bond setup from bond definition and contribution frequency', () => {
    const setup = resolveRegularInvestmentBondSetup({
      bondType: BondType.TOS,
      duration: 36,
      frequency: InvestmentFrequency.QUARTERLY,
      isRebought: true,
      rebuyDiscount: 0.1,
    });

    expect(setup.nominalValue).toBe(100);
    expect(setup.bondDuration).toBe(36);
    expect(setup.interval).toBe(3);
    expect(setup.bondPrice.toNumber()).toBe(99.9);
  });

  it('keeps OTS duration as one quarter regardless of caller duration', () => {
    const setup = resolveRegularInvestmentBondSetup({
      bondType: BondType.OTS,
      duration: 12,
      frequency: InvestmentFrequency.MONTHLY,
      isRebought: false,
      rebuyDiscount: 0,
    });

    expect(setup.bondDuration).toBe(0.25);
    expect(setup.bondPrice.toNumber()).toBe(100);
  });

  it('creates lots only on active cadence months before the terminal month', () => {
    expect(shouldCreateRegularInvestmentLot({ monthIndex: 0, interval: 3, totalMonths: 12 })).toBe(
      true,
    );
    expect(shouldCreateRegularInvestmentLot({ monthIndex: 1, interval: 3, totalMonths: 12 })).toBe(
      false,
    );
    expect(shouldCreateRegularInvestmentLot({ monthIndex: 12, interval: 3, totalMonths: 12 })).toBe(
      false,
    );
  });

  it('uses matured liquidity only when rollover is enabled', () => {
    expect(
      resolveRegularInvestmentPurchaseCash({
        contributionAmount: 1000,
        maturedLiquidity: new Decimal(250),
        rolloverEnabled: true,
      }).toNumber(),
    ).toBe(1250);
    expect(
      resolveRegularInvestmentPurchaseCash({
        contributionAmount: 1000,
        maturedLiquidity: new Decimal(250),
        rolloverEnabled: false,
      }).toNumber(),
    ).toBe(1000);
  });
});
