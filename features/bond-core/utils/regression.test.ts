import { describe, it, expect } from 'vitest';
import { calculateBondInvestment } from './calculations';
import regressionScenarios from '../fixtures/regression-scenarios.json';
import { BondInputs } from '../types';

interface RegressionScenarioFixture {
  name: string;
  inputs: BondInputs;
  expected: {
    totalProfit?: number;
    totalTax?: number;
    grossValue?: number;
    finalNominalValue?: number;
    netPayoutValue?: number;
    totalEarlyWithdrawalFee?: number;
    dataQualityFlagsIncludes?: string[];
    calculationNotesIncludes?: string[];
  };
}

describe('Regression Parity Tests', () => {
  (regressionScenarios as RegressionScenarioFixture[]).forEach((scenario) => {
    it(`matches fixture: ${scenario.name}`, () => {
      const results = calculateBondInvestment(scenario.inputs as BondInputs);
      
      if (scenario.expected.totalProfit !== undefined) {
        expect(results.totalProfit).toBeCloseTo(scenario.expected.totalProfit, 2);
      }
      if (scenario.expected.totalTax !== undefined) {
        expect(results.totalTax).toBeCloseTo(scenario.expected.totalTax, 2);
      }
      if (scenario.expected.grossValue !== undefined) {
        expect(results.grossValue).toBeCloseTo(scenario.expected.grossValue, 2);
      }
      if (scenario.expected.finalNominalValue !== undefined) {
        expect(results.finalNominalValue).toBeCloseTo(scenario.expected.finalNominalValue, 2);
      }
      if (scenario.expected.netPayoutValue !== undefined) {
        expect(results.netPayoutValue).toBeCloseTo(scenario.expected.netPayoutValue, 2);
      }
      if (scenario.expected.totalEarlyWithdrawalFee !== undefined) {
        expect(results.totalEarlyWithdrawalFee).toBeCloseTo(scenario.expected.totalEarlyWithdrawalFee, 2);
      }
      if (scenario.expected.dataQualityFlagsIncludes) {
        expect(results.dataQualityFlags).toEqual(
          expect.arrayContaining(scenario.expected.dataQualityFlagsIncludes),
        );
      }
      if (scenario.expected.calculationNotesIncludes) {
        expect(results.calculationNotes).toEqual(
          expect.arrayContaining(scenario.expected.calculationNotesIncludes),
        );
      }
    });
  });
});
