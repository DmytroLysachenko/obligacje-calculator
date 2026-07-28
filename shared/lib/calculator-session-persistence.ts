import { areCalculatorStatesEqual } from './calculator-state';

export interface PersistedCalculatorSession<TInputs, TResult> {
  draftInputs: TInputs;
  committedInputs: TInputs | null;
  committedResult: TResult | null;
}

export interface RestoredCalculatorSession<TInputs, TResult> extends PersistedCalculatorSession<TInputs, TResult> {
  restoredFromPersistence: boolean;
}

export function restoreCalculatorSession<TInputs, TResult>(
  persisted: PersistedCalculatorSession<TInputs, TResult> | null,
  fallbackInputs: TInputs,
  isCommittedResultValid: (result: TResult) => boolean = () => true,
): RestoredCalculatorSession<TInputs, TResult> {
  if (!persisted) {
    return { draftInputs: fallbackInputs, committedInputs: null, committedResult: null, restoredFromPersistence: false };
  }
  const validResult = persisted.committedResult !== null && isCommittedResultValid(persisted.committedResult);
  return {
    draftInputs: persisted.draftInputs ?? fallbackInputs,
    committedInputs: validResult ? persisted.committedInputs : null,
    committedResult: validResult ? persisted.committedResult : null,
    restoredFromPersistence: true,
  };
}

export function applyUntouchedMacroDefaults<T extends { expectedInflation?: number; expectedNbpRate?: number }>(
  inputs: T,
  defaults: { expectedInflation: number; expectedNbpRate: number },
  hasTouchedMacroAssumptions: boolean,
): T {
  if (hasTouchedMacroAssumptions) return inputs;
  const next = { ...inputs, expectedInflation: defaults.expectedInflation, expectedNbpRate: defaults.expectedNbpRate };
  return areCalculatorStatesEqual(inputs, next) ? inputs : next;
}

export function createPersistedCalculatorSession<TInputs, TResult>(
  draftInputs: TInputs,
  committedInputs: TInputs | null,
  committedResult: TResult | null,
): PersistedCalculatorSession<TInputs, TResult> {
  return { draftInputs, committedInputs, committedResult };
}
