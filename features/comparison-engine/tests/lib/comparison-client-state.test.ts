import { describe, expect, it } from 'vitest';

import {
  buildDefaultSharedConfig,
  DEFAULT_SCENARIO_A,
  DEFAULT_SCENARIO_B,
} from '../../lib/comparison-calculator-state';
import {
  applyComparisonMacroDefaults,
  buildComparisonPersistenceSnapshot,
  reconcileComparisonPersistedMacroDefaults,
} from '../../lib/comparison-client-state';

describe('comparison client state', () => {
  it('applies macro defaults without changing stable config references unnecessarily', () => {
    const previous = buildDefaultSharedConfig();
    const next = applyComparisonMacroDefaults(previous, {
      expectedInflation: 4.2,
      expectedNbpRate: 5.1,
    });

    expect(next).toMatchObject({
      expectedInflation: 4.2,
      expectedNbpRate: 5.1,
    });
    expect(
      applyComparisonMacroDefaults(next, { expectedInflation: 4.2, expectedNbpRate: 5.1 }),
    ).toBe(next);
  });

  it('reconciles legacy persisted macro defaults through the shared baseline helper', () => {
    const previous = buildDefaultSharedConfig();

    expect(
      reconcileComparisonPersistedMacroDefaults(previous, {
        expectedInflation: 3.9,
        expectedNbpRate: 4.75,
      }),
    ).toMatchObject({
      expectedInflation: 3.9,
      expectedNbpRate: 4.75,
    });
  });

  it('preserves custom persisted macro defaults during reconciliation', () => {
    const previous = {
      ...buildDefaultSharedConfig(),
      expectedInflation: 999,
      expectedNbpRate: 999,
    };

    expect(
      reconcileComparisonPersistedMacroDefaults(previous, {
        expectedInflation: 3.5,
        expectedNbpRate: 4.75,
      }),
    ).toMatchObject({
      expectedInflation: 999,
      expectedNbpRate: 999,
    });
  });

  it('builds the persisted comparison snapshot used by the hook', () => {
    const sharedConfig = buildDefaultSharedConfig();

    expect(
      buildComparisonPersistenceSnapshot({
        sharedConfig,
        scenarioA: DEFAULT_SCENARIO_A,
        scenarioB: DEFAULT_SCENARIO_B,
        comparisonEnvelope: null,
        committedInputsA: null,
        committedInputsB: null,
        isDirty: true,
      }),
    ).toMatchObject({
      sharedConfig,
      scenarioA: DEFAULT_SCENARIO_A,
      scenarioB: DEFAULT_SCENARIO_B,
      comparisonEnvelope: null,
      isDirty: true,
    });
  });
});
