import { describe, expect, it } from 'vitest';

import scenarios from '../../fixtures/regression-scenarios.json';
import { MODEL_VERSION } from '../../model-version';
import { BondInputs } from '../../types';
import { calculateBondInvestment } from '../../utils/calculations';

describe('Bond Engine Regression: Golden Results', () => {
  it('uses the fixture written for the active financial model', () => {
    expect(scenarios.modelVersion).toBe(MODEL_VERSION);
  });

  scenarios.scenarios.forEach((scenario) => {
    it(`matches golden result for: ${scenario.name}`, () => {
      const result = calculateBondInvestment(scenario.inputs as unknown as BondInputs);

      const expected = scenario.expected;

      expect(String(result.totalProfit)).toBe(expected.totalProfit);
      expect(String(result.totalTax)).toBe(expected.totalTax);
      expect(String(result.netPayoutValue)).toBe(expected.netPayoutValue);
      expect(String(result.finalNominalValue)).toBe(expected.finalNominalValue);
      expect(String(result.finalRealValue)).toBe(expected.finalRealValue);
      expect(result.maturityDate).toBe(expected.maturityDate);
      expect(result.isEarlyWithdrawal).toBe(expected.isEarlyWithdrawal);
      expect(result.timeline).toHaveLength(expected.timelineLength);
    });
  });
});
