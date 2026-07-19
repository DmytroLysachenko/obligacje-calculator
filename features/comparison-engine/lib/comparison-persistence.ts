import { BondInputs } from '@/features/bond-core/types';
import { BondComparisonCalculationEnvelope } from '@/features/bond-core/types/scenarios';

import { ScenarioOverride, SharedComparisonConfig } from './comparison-calculator-state';
import type { ComparisonBondPair } from './comparison-deep-link';
import { sanitizeScenarioOverride } from './comparison-scenario-state';

export const COMPARISON_CALCULATOR_STORAGE_KEY = 'obligacje.comparison-calculator.v3';

export interface PersistedComparisonState {
  sharedConfig: SharedComparisonConfig;
  scenarioA: ScenarioOverride;
  scenarioB: ScenarioOverride;
  comparisonEnvelope: BondComparisonCalculationEnvelope | null;
  committedInputsA: BondInputs | null;
  committedInputsB: BondInputs | null;
  isDirty: boolean;
}

export interface RestoredComparisonState extends PersistedComparisonState {
  restoredFromPersistence: boolean;
}

export function restoreComparisonState(
  restoredState: PersistedComparisonState | null,
  initialPair?: ComparisonBondPair | null,
): RestoredComparisonState | null {
  if (!restoredState) {
    return null;
  }

  const restored = {
    sharedConfig: restoredState.sharedConfig,
    scenarioA: sanitizeScenarioOverride(restoredState.sharedConfig, restoredState.scenarioA),
    scenarioB: sanitizeScenarioOverride(restoredState.sharedConfig, restoredState.scenarioB),
    comparisonEnvelope: restoredState.comparisonEnvelope ?? null,
    committedInputsA: restoredState.committedInputsA ?? null,
    committedInputsB: restoredState.committedInputsB ?? null,
    isDirty: restoredState.isDirty ?? true,
    restoredFromPersistence: true,
  };

  if (!initialPair) {
    return restored;
  }

  return {
    ...restored,
    scenarioA: { bondType: initialPair[0], isRebought: false },
    scenarioB: { bondType: initialPair[1], isRebought: false },
    comparisonEnvelope: null,
    committedInputsA: null,
    committedInputsB: null,
    isDirty: true,
  };
}

export function buildPersistedComparisonState({
  sharedConfig,
  scenarioA,
  scenarioB,
  comparisonEnvelope,
  committedInputsA,
  committedInputsB,
  isDirty,
}: PersistedComparisonState): PersistedComparisonState {
  return {
    sharedConfig,
    scenarioA: sanitizeScenarioOverride(sharedConfig, scenarioA),
    scenarioB: sanitizeScenarioOverride(sharedConfig, scenarioB),
    comparisonEnvelope,
    committedInputsA,
    committedInputsB,
    isDirty,
  };
}
