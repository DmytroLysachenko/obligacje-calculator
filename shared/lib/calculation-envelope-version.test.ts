import { describe, expect, it } from 'vitest';

import { createCalculationEnvelopeVersionValidator, isCompatibleCalculationEnvelope } from './calculation-envelope-version';

describe('persisted calculation envelope compatibility', () => {
  it.each([
    [null, false], [{}, false], [{ calculationVersion: '2.8.0' }, false],
    [{ calculationVersion: '2.7.0', result: {} }, false],
    [{ calculationVersion: '2.8.0', result: null }, true],
    [{ calculationVersion: '2.8.0', result: { total: 100 } }, true],
  ])('accepts only active-model envelopes (%o)', (value, expected) => {
    expect(isCompatibleCalculationEnvelope(value, '2.8.0')).toBe(expected);
  });

  it('builds a restoration validator with a fixed expected version', () => {
    const validator = createCalculationEnvelopeVersionValidator('current');
    expect(validator({ calculationVersion: 'current', result: {} })).toBe(true);
    expect(validator({ calculationVersion: 'old', result: {} })).toBe(false);
  });
});
