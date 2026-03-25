import { describe, it, expect } from 'vitest';
import { calculateBondInvestment } from './calculations';
import regressionScenarios from '../fixtures/regression-scenarios.json';
import { BondInputs } from '../types';

describe('Regression Parity Tests', () => {
  regressionScenarios.forEach((scenario) => {
    it(`matches fixture: ${scenario.name}`, () => {
      const results = calculateBondInvestment(scenario.inputs as BondInputs);
      
      if (scenario.expected.totalProfit !== undefined) {
        expect(results.totalProfit).toBeCloseTo(scenario.expected.totalProfit, 0);
      }
      if (scenario.expected.totalTax !== undefined) {
        expect(results.totalTax).toBeCloseTo(scenario.expected.totalTax, 0);
      }
      if (scenario.expected.grossValue !== undefined) {
        expect(results.grossValue).toBeCloseTo(scenario.expected.grossValue, 0);
      }
      if (scenario.expected.finalNominalValue !== undefined) {
        expect(results.finalNominalValue).toBeCloseTo(scenario.expected.finalNominalValue, 0);
      }
    });
  });
});
