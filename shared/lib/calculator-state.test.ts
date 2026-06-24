import { describe, expect, it } from 'vitest';

import {
  areCalculatorStatesEqual,
  preserveStableState,
  restoreVersionedEnvelope,
  stripDisplayOnlyInputs,
} from './calculator-state';

describe('calculator-state helpers', () => {
  it('removes display-only inputs before persistence or calculation comparisons', () => {
    const inputs = {
      bondType: 'EDO',
      chartStep: 'monthly',
      expectedInflation: 3.2,
    };

    expect(stripDisplayOnlyInputs(inputs)).toEqual({
      bondType: 'EDO',
      expectedInflation: 3.2,
    });
    expect(inputs.chartStep).toBe('monthly');
  });

  it('keeps prior state identity when the next state is equivalent', () => {
    const previous = { expectedInflation: 3.2, path: [1, 2, 3] };
    const next = { expectedInflation: 3.2, path: [1, 2, 3] };

    expect(preserveStableState(previous, next)).toBe(previous);
  });

  it('returns the next state when state content changed', () => {
    const previous = { expectedInflation: 3.2 };
    const next = { expectedInflation: 3.3 };

    expect(preserveStableState(previous, next)).toBe(next);
  });

  it('compares calculator state by serialized value', () => {
    expect(areCalculatorStatesEqual({ value: 1 }, { value: 1 })).toBe(true);
    expect(areCalculatorStatesEqual({ value: 1 }, { value: 2 })).toBe(false);
  });

  it('restores only envelopes matching the active model version', () => {
    const envelope = { calculationVersion: '2.8.0', result: { value: 1 } };

    expect(restoreVersionedEnvelope(envelope, '2.8.0')).toBe(envelope);
    expect(restoreVersionedEnvelope(envelope, '2.9.0')).toBeNull();
    expect(restoreVersionedEnvelope(null, '2.8.0')).toBeNull();
  });
});
