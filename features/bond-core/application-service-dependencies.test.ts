import { describe, expect, it, vi } from 'vitest';

import { BOND_DEFINITIONS } from './constants/bond-definitions';
import { CalculationDataFreshness, CalculationEnvelope, ScenarioKind } from './types/scenarios';
import {
  CalculationApplicationService,
  CalculationServiceDependencies,
} from './application-service';
import { BondType, InterestPayout, TaxStrategy } from './types';

const basePayload = {
  bondType: BondType.EDO,
  initialInvestment: 1000,
  firstYearRate: 5.35,
  expectedInflation: 3,
  expectedNbpRate: 5.25,
  margin: 2,
  duration: 10,
  earlyWithdrawalFee: 2,
  taxRate: 19,
  isCapitalized: true,
  payoutFrequency: InterestPayout.MATURITY,
  purchaseDate: '2026-06-01',
  withdrawalDate: '2036-06-01',
  isRebought: false,
  rebuyDiscount: 0,
  taxStrategy: TaxStrategy.STANDARD,
};

describe('CalculationApplicationService dependencies', () => {
  it('uses injected cache, definitions, freshness, and handler dependencies', async () => {
    const envelope: CalculationEnvelope<{ ok: true }> = {
      result: { ok: true },
      warnings: [],
      assumptions: [],
      calculationNotes: [],
      dataQualityFlags: [],
      dataFreshness: { status: 'fresh', usedFallback: false },
    };
    const handler = {
      kind: ScenarioKind.SINGLE_BOND,
      handle: vi.fn(async () => envelope),
    };
    const freshness: CalculationDataFreshness = { status: 'fresh', usedFallback: false };
    const dependencies: CalculationServiceDependencies = {
      cache: {
        generateKey: vi.fn(() => 'cache-key'),
        get: vi.fn(() => null),
        set: vi.fn(),
      },
      getDataFreshness: vi.fn(async () => freshness),
      getDefinitions: vi.fn(async () => BOND_DEFINITIONS),
      getHandler: vi.fn(() => handler),
    };

    const service = new CalculationApplicationService(dependencies);
    const result = await service.calculate({
      kind: ScenarioKind.SINGLE_BOND,
      payload: basePayload,
    });

    expect(result).toBe(envelope);
    expect(dependencies.getHandler).toHaveBeenCalledWith(ScenarioKind.SINGLE_BOND);
    expect(handler.handle).toHaveBeenCalledWith(basePayload, {
      dataFreshness: freshness,
      dbDefinitions: BOND_DEFINITIONS,
    });
    expect(dependencies.cache.set).toHaveBeenCalledWith('cache-key', envelope);
  });
});
