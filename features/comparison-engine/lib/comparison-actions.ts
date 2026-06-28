import {
  BondComparisonCalculationEnvelope,
  ScenarioKind,
} from '@/features/bond-core/types/scenarios';
import { getCalculationEndpoint } from '@/shared/lib/calculation-endpoints';

import { ScenarioOverride, SharedComparisonConfig } from './comparison-calculator-state';

type PostCalculation = <TResponse>(
  endpoint: string,
  payload: unknown,
  options?: { preferWorker?: boolean },
) => Promise<TResponse>;

function buildIndependentComparisonPayload({
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

export function runComparisonCalculation({
  sharedConfig,
  scenarioA,
  scenarioB,
  post,
}: {
  sharedConfig: SharedComparisonConfig;
  scenarioA: ScenarioOverride;
  scenarioB: ScenarioOverride;
  post: PostCalculation;
}) {
  return post<BondComparisonCalculationEnvelope>(
    getCalculationEndpoint(ScenarioKind.BOND_COMPARISON),
    buildIndependentComparisonPayload({ sharedConfig, scenarioA, scenarioB }),
    { preferWorker: true },
  );
}
