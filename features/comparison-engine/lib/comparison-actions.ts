import { ScenarioOverride, SharedComparisonConfig } from './comparison-calculator-state';

export function buildIndependentComparisonPayload({
  sharedConfig,
  scenarioA,
  scenarioB,
}: {
  sharedConfig: SharedComparisonConfig;
  scenarioA: ScenarioOverride;
  scenarioB: ScenarioOverride;
}) {
  return {
    mode: 'independent' as const,
    sharedConfig,
    scenarioA,
    scenarioB,
  };
}
