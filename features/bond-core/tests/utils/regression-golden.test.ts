import { describe, expect, it } from 'vitest';

import scenarios from '../../fixtures/regression-scenarios.json';
import { MODEL_VERSION } from '../../model-version';
import { BondInputs } from '../../types';
import { calculateBondInvestment } from '../../utils/calculations';

function formatWarsawCalendarDate(value: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value;

  return `${part('year')}-${part('month')}-${part('day')}`;
}

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
      expect(formatWarsawCalendarDate(result.maturityDate)).toBe(expected.maturityCalendarDate);
      expect(result.isEarlyWithdrawal).toBe(expected.isEarlyWithdrawal);
      expect(result.timeline).toHaveLength(expected.timelineLength);
    });
  });
});
