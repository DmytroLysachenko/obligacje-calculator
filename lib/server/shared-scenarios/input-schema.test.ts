import { describe, expect, it } from 'vitest';

import { BOND_DEFINITIONS } from '@/features/bond-core/constants/bond-definitions';
import { BondType, TaxStrategy } from '@/features/bond-core/types';

import {
  SHARED_SCENARIO_LIMITS,
  SharedScenarioAbuseReportSchema,
  SharedScenarioPayloadSchema,
} from './input-schema';

const definition = BOND_DEFINITIONS[BondType.EDO];
const validInputs = {
  bondType: BondType.EDO,
  initialInvestment: 10_000,
  firstYearRate: definition.firstYearRate,
  expectedInflation: 3,
  expectedNbpRate: 5,
  margin: definition.margin,
  duration: definition.duration,
  earlyWithdrawalFee: definition.earlyWithdrawalFee,
  taxRate: 19,
  isCapitalized: definition.isCapitalized,
  payoutFrequency: definition.payoutFrequency,
  purchaseDate: '2026-05-30',
  withdrawalDate: '2036-05-30',
  isRebought: false,
  rebuyDiscount: definition.rebuyDiscount,
  taxStrategy: TaxStrategy.STANDARD,
  timingMode: 'exact' as const,
  investmentHorizonMonths: 120,
};

describe('SharedScenarioPayloadSchema', () => {
  it('accepts only opaque references and reason codes for abuse reports', () => {
    expect(
      SharedScenarioAbuseReportSchema.parse({
        shareId: '123e4567-e89b-12d3-a456-426614174000',
        reason: 'spam',
      }),
    ).toEqual({ shareId: '123e4567-e89b-12d3-a456-426614174000', reason: 'spam' });
    expect(
      SharedScenarioAbuseReportSchema.safeParse({
        shareId: 'not-a-reference',
        reason: 'freeform payload is not accepted',
      }).success,
    ).toBe(false);
  });

  it('accepts a complete bounded calculator snapshot', () => {
    const payload = SharedScenarioPayloadSchema.parse({
      inputs: validInputs,
      description: ' Long-term retirement alternative ',
    });

    expect(payload).toEqual({
      inputs: validInputs,
      description: 'Long-term retirement alternative',
    });
  });

  it('allows a share without a user-provided description', () => {
    expect(SharedScenarioPayloadSchema.parse({ inputs: validInputs })).toEqual({
      inputs: validInputs,
    });
  });

  it('rejects unknown top-level fields rather than treating shares as generic storage', () => {
    expect(
      SharedScenarioPayloadSchema.safeParse({
        inputs: validInputs,
        ownerId: 'attacker-controlled',
      }).success,
    ).toBe(false);
  });

  it.each([
    ['', 'empty description is permitted after trim'],
    ['x'.repeat(SHARED_SCENARIO_LIMITS.descriptionLength), 'maximum description'],
  ])('accepts %s', (description) => {
    expect(
      SharedScenarioPayloadSchema.safeParse({ inputs: validInputs, description }).success,
    ).toBe(true);
  });

  it('rejects description beyond retention-safe storage boundary', () => {
    expect(
      SharedScenarioPayloadSchema.safeParse({
        inputs: validInputs,
        description: 'x'.repeat(SHARED_SCENARIO_LIMITS.descriptionLength + 1),
      }).success,
    ).toBe(false);
  });

  it.each([
    [{ initialInvestment: Number.POSITIVE_INFINITY }, 'infinite money'],
    [{ expectedInflation: Number.NaN }, 'NaN rate'],
    [{ bondType: 'UNKNOWN' }, 'unknown bond type'],
    [{ purchaseDate: '2026-02-30' }, 'impossible purchase date'],
    [{ withdrawalDate: '2025-05-30' }, 'withdrawal before purchase'],
    [{ investmentHorizonMonths: 12.5 }, 'fractional horizon'],
    [{ customInflation: Array.from({ length: 601 }, () => 3) }, 'oversized rate path'],
    [{ selectedSeriesId: 'not-a-uuid' }, 'invalid series id'],
  ])('rejects invalid financial snapshot: %s', (override, _label) => {
    void _label;
    expect(
      SharedScenarioPayloadSchema.safeParse({
        inputs: { ...validInputs, ...override },
      }).success,
    ).toBe(false);
  });

  it('preserves optional valid calculator controls', () => {
    expect(
      SharedScenarioPayloadSchema.parse({
        inputs: {
          ...validInputs,
          customInflation: Array.from({ length: 10 }, () => 3),
          customNbpRate: Array.from({ length: 10 }, () => 5),
          inflationScenario: 'base',
          rollover: true,
          useTaxWrapperLimit: true,
        },
      }).inputs,
    ).toMatchObject({
      rollover: true,
      useTaxWrapperLimit: true,
      inflationScenario: 'base',
    });
  });

  it('does not coerce string values into a financial command', () => {
    expect(
      SharedScenarioPayloadSchema.safeParse({
        inputs: { ...validInputs, initialInvestment: '10000' },
      }).success,
    ).toBe(false);
  });

  it('does not coerce a boolean string into calculator state', () => {
    expect(
      SharedScenarioPayloadSchema.safeParse({
        inputs: { ...validInputs, isRebought: 'false' },
      }).success,
    ).toBe(false);
  });
});
