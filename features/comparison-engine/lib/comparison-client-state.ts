import type { BondInputs } from '@/features/bond-core/types';
import type { BondComparisonCalculationEnvelope } from '@/features/bond-core/types/scenarios';
import { preserveStableState } from '@/shared/lib/calculator-state';
import { applyMacroDefaultsToBaseline } from '@/shared/lib/macro-assumption-defaults';

import type { ScenarioOverride, SharedComparisonConfig } from './comparison-calculator-state';
import { buildPersistedComparisonState } from './comparison-persistence';

interface MacroDefaults {
  expectedInflation: number;
  expectedNbpRate: number;
}

export function applyComparisonMacroDefaults(
  previous: SharedComparisonConfig,
  defaults: MacroDefaults,
) {
  return preserveStableState(previous, {
    ...previous,
    expectedInflation: defaults.expectedInflation,
    expectedNbpRate: defaults.expectedNbpRate,
  });
}

export function reconcileComparisonPersistedMacroDefaults(
  previous: SharedComparisonConfig,
  defaults: MacroDefaults,
) {
  return preserveStableState(previous, applyMacroDefaultsToBaseline(previous, defaults));
}

export function buildComparisonPersistenceSnapshot({
  sharedConfig,
  scenarioA,
  scenarioB,
  comparisonEnvelope,
  committedInputsA,
  committedInputsB,
  isDirty,
}: {
  sharedConfig: SharedComparisonConfig;
  scenarioA: ScenarioOverride;
  scenarioB: ScenarioOverride;
  comparisonEnvelope: BondComparisonCalculationEnvelope | null;
  committedInputsA: BondInputs | null;
  committedInputsB: BondInputs | null;
  isDirty: boolean;
}) {
  return buildPersistedComparisonState({
    sharedConfig,
    scenarioA,
    scenarioB,
    comparisonEnvelope,
    committedInputsA,
    committedInputsB,
    isDirty,
  });
}
