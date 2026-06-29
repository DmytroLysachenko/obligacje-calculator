import { describe, expect, it } from 'vitest';

import { BondType } from '@/features/bond-core/types';

import {
  buildDefaultSharedConfig,
  DEFAULT_SCENARIO_A,
} from '../../lib/comparison-calculator-state';
import {
  buildPersistedComparisonState,
  COMPARISON_CALCULATOR_STORAGE_KEY,
  restoreComparisonState,
} from '../../lib/comparison-persistence';

describe('comparison persistence model', () => {
  it('exposes the stable comparison storage key', () => {
    expect(COMPARISON_CALCULATOR_STORAGE_KEY).toBe('obligacje.comparison-calculator.v3');
  });

  it('returns null when no persisted comparison state exists', () => {
    expect(restoreComparisonState(null)).toBeNull();
  });

  it('sanitizes restored scenario overrides against shared config', () => {
    const sharedConfig = buildDefaultSharedConfig(new Date('2026-06-16T00:00:00.000Z'));
    const restored = restoreComparisonState({
      sharedConfig,
      scenarioA: { ...DEFAULT_SCENARIO_A, bondType: BondType.ROR },
      scenarioB: { ...DEFAULT_SCENARIO_A, bondType: BondType.DOR, investmentHorizonMonths: 24 },
      comparisonEnvelope: null,
      committedInputsA: null,
      committedInputsB: null,
      isDirty: false,
    });

    expect(restored).toMatchObject({
      sharedConfig,
      comparisonEnvelope: null,
      committedInputsA: null,
      committedInputsB: null,
      isDirty: false,
      restoredFromPersistence: true,
    });
    expect(restored?.scenarioA.investmentHorizonMonths).toBeUndefined();
    expect(restored?.scenarioB.investmentHorizonMonths).toBe(24);
    expect(restored?.scenarioB.timingMode).toBe('general');
  });

  it('builds a sanitized save payload', () => {
    const sharedConfig = buildDefaultSharedConfig(new Date('2026-06-16T00:00:00.000Z'));

    const persisted = buildPersistedComparisonState({
      sharedConfig,
      scenarioA: { ...DEFAULT_SCENARIO_A },
      scenarioB: { ...DEFAULT_SCENARIO_A, investmentHorizonMonths: 18 },
      comparisonEnvelope: null,
      committedInputsA: null,
      committedInputsB: null,
      isDirty: true,
    });

    expect(persisted).toMatchObject({
      sharedConfig,
      scenarioB: { investmentHorizonMonths: 18 },
      comparisonEnvelope: null,
      committedInputsA: null,
      committedInputsB: null,
      isDirty: true,
    });
    expect(persisted.scenarioA).not.toHaveProperty('investmentHorizonMonths');
  });
});
