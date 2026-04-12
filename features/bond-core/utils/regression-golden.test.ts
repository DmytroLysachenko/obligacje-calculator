import { describe, it, expect } from 'vitest';
import { calculateBondInvestment } from './calculations';
import { BondInputs } from '../types';
import scenarios from '../fixtures/regression-scenarios.json';

describe('Bond Engine Regression: Golden Results', () => {
  scenarios.forEach((scenario) => {
    it(`matches golden result for: ${scenario.name}`, () => {
      const result = calculateBondInvestment(scenario.inputs as unknown as BondInputs);
      
      const expected = scenario.expected;
      
      if (expected.totalProfit !== undefined) {
        expect(result.totalProfit).toBeCloseTo(expected.totalProfit, 1);
      }
      
      if (expected.totalTax !== undefined) {
        // Tax rounding can be tricky, allow small margin
        expect(Math.abs(result.totalTax - expected.totalTax)).toBeLessThanOrEqual(2);
      }
      
      if (expected.grossValue !== undefined) {
        expect(result.grossValue).toBeCloseTo(expected.grossValue, 1);
      }
      
      if (expected.finalNominalValue !== undefined) {
        expect(result.finalNominalValue).toBeCloseTo(expected.finalNominalValue, 1);
      }
      
      if (expected.netPayoutValue !== undefined) {
        expect(result.netPayoutValue).toBeCloseTo(expected.netPayoutValue, 1);
      }
      
      if (expected.totalEarlyWithdrawalFee !== undefined) {
        expect(result.totalEarlyWithdrawalFee).toBeCloseTo(expected.totalEarlyWithdrawalFee, 1);
      }
    });
  });
});
