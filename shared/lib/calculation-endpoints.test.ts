import { describe, expect, it } from 'vitest';
import { ScenarioKind } from '@/features/bond-core/types/scenarios';
import { getCalculationEndpoint } from './calculation-endpoints';

describe('calculation endpoints', () => {
  it('centralizes calculation route URLs', () => {
    expect(getCalculationEndpoint(ScenarioKind.SINGLE_BOND)).toBe('/api/calculate/single');
    expect(getCalculationEndpoint(ScenarioKind.REGULAR_INVESTMENT)).toBe('/api/calculate/regular');
    expect(getCalculationEndpoint(ScenarioKind.BOND_COMPARISON)).toBe('/api/calculate/compare');
    expect(getCalculationEndpoint(ScenarioKind.BOND_OPTIMIZER)).toBe('/api/calculate/optimize');
    expect(getCalculationEndpoint(ScenarioKind.RETIREMENT_PLANNER)).toBe('/api/calculate/retirement');
    expect(getCalculationEndpoint(ScenarioKind.PORTFOLIO_SIMULATION)).toBe('/api/portfolio/simulate');
  });
});
