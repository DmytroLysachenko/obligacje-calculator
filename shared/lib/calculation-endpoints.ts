import { ScenarioKind } from '@/features/bond-core/types/scenarios';

export const calculationEndpoints = {
  [ScenarioKind.SINGLE_BOND]: '/api/calculate/single',
  [ScenarioKind.REGULAR_INVESTMENT]: '/api/calculate/regular',
  [ScenarioKind.BOND_COMPARISON]: '/api/calculate/compare',
  [ScenarioKind.BOND_OPTIMIZER]: '/api/calculate/optimize',
  [ScenarioKind.RETIREMENT_PLANNER]: '/api/calculate/retirement',
  [ScenarioKind.PORTFOLIO_SIMULATION]: '/api/portfolio/simulate',
} as const satisfies Partial<Record<ScenarioKind, string>>;

export type CalculationEndpointKind = keyof typeof calculationEndpoints;

export function getCalculationEndpoint(kind: CalculationEndpointKind) {
  return calculationEndpoints[kind];
}
