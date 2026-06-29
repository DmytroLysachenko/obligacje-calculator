import { BondInputs } from '@/features/bond-core/types';
import { BondComparisonCalculationEnvelope } from '@/features/bond-core/types/scenarios';

import { ScenarioOverride, SharedComparisonConfig } from './comparison-calculator-state';
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
): RestoredComparisonState | null {
  if (!restoredState) {
    return null;
  }

  return {
    sharedConfig: restoredState.sharedConfig,
    scenarioA: sanitizeScenarioOverride(restoredState.sharedConfig, restoredState.scenarioA),
    scenarioB: sanitizeScenarioOverride(restoredState.sharedConfig, restoredState.scenarioB),
    comparisonEnvelope: restoredState.comparisonEnvelope ?? null,
    committedInputsA: restoredState.committedInputsA ?? null,
    committedInputsB: restoredState.committedInputsB ?? null,
    isDirty: restoredState.isDirty ?? true,
    restoredFromPersistence: true,
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
