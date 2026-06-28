import { MODEL_VERSION } from '@/features/bond-core/model-version';
import { BondInputs } from '@/features/bond-core/types';
import { SingleBondCalculationEnvelope } from '@/features/bond-core/types/scenarios';
import { restoreVersionedEnvelope, stripDisplayOnlyInputs } from '@/shared/lib/calculator-state';

export const SINGLE_CALCULATOR_STORAGE_KEY = 'obligacje.single-calculator.v1';

export interface PersistedSingleCalculatorState {
  inputs: BondInputs;
  envelope: SingleBondCalculationEnvelope | null;
  selectedSeriesId: string | null;
  lastCommittedInputs: BondInputs | null;
  isDirty: boolean;
}

interface RestoredSingleCalculatorState {
  inputs: BondInputs;
  envelope: SingleBondCalculationEnvelope | null;
  selectedSeriesId: string | null;
  lastCommittedInputs: BondInputs | null;
  isDirty: boolean;
  restoredFromPersistence: boolean;
}

export function restoreSingleCalculatorState(
  restoredState: PersistedSingleCalculatorState | null,
  fallbackInputs: BondInputs,
): RestoredSingleCalculatorState | null {
  if (!restoredState) {
    return null;
  }

  const restoredEnvelope = restoreVersionedEnvelope(restoredState.envelope, MODEL_VERSION);

  return {
    inputs: stripDisplayOnlyInputs(restoredState.inputs) ?? fallbackInputs,
    envelope: restoredEnvelope,
    selectedSeriesId: restoredState.selectedSeriesId ?? null,
    lastCommittedInputs: restoredEnvelope
      ? stripDisplayOnlyInputs(restoredState.lastCommittedInputs ?? null)
      : null,
    isDirty: restoredEnvelope ? (restoredState.isDirty ?? true) : true,
    restoredFromPersistence: true,
  };
}

export function buildPersistedSingleCalculatorState({
  inputs,
  envelope,
  selectedSeriesId,
  lastCommittedInputs,
  isDirty,
}: PersistedSingleCalculatorState): PersistedSingleCalculatorState {
  return {
    inputs,
    envelope,
    selectedSeriesId,
    lastCommittedInputs,
    isDirty,
  };
}
