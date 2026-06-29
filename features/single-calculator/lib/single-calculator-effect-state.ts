import { BOND_DEFINITIONS } from '@/features/bond-core/constants/bond-definitions';
import { BondInputs, BondType } from '@/features/bond-core/types';
import { preserveStableState } from '@/shared/lib/calculator-state';
import { applyMacroDefaultsToBaseline } from '@/shared/lib/macro-assumption-defaults';

import { applyDefinitionToInputs } from './single-calculator-state';

export interface MacroDefaults {
  expectedInflation: number;
  expectedNbpRate: number;
}

export function applySingleCalculatorMacroDefaults(
  previous: BondInputs,
  defaults: MacroDefaults,
): BondInputs {
  return preserveStableState(previous, {
    ...previous,
    expectedInflation: defaults.expectedInflation,
    expectedNbpRate: defaults.expectedNbpRate,
  });
}

export function reconcilePersistedSingleCalculatorMacroDefaults(
  previous: BondInputs,
  defaults: MacroDefaults,
): BondInputs {
  return preserveStableState(previous, applyMacroDefaultsToBaseline(previous, defaults));
}

export function resolveDefinitionSyncedInputs({
  previous,
  definitions,
  selectedSeriesId,
}: {
  previous: BondInputs;
  definitions: typeof BOND_DEFINITIONS;
  selectedSeriesId: string | null;
}) {
  const definition = definitions[previous.bondType as BondType];

  if (!definition) {
    return previous;
  }

  return preserveStableState(
    previous,
    applyDefinitionToInputs(previous, definition, selectedSeriesId),
  );
}
