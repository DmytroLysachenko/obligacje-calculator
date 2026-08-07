'use client';

import { useCallback, useEffect, useReducer, useState } from 'react';

import {
  loadPersistedCalculatorState,
  savePersistedCalculatorState,
} from '@/shared/lib/calculator-persistence';
import {
  createCalculatorSessionState,
  isCalculatorSessionDirty,
  reduceCalculatorSession,
} from '@/shared/lib/calculator-session';
import {
  createPersistedCalculatorSession,
  type PersistedCalculatorSession,
  restoreCalculatorSession,
} from '@/shared/lib/calculator-session-persistence';
import { CalculatorSessionWorkflow } from '@/shared/lib/calculator-session-workflow';

interface UseCalculatorSessionOptions<TInputs, TResult> {
  initialInputs: TInputs;
  storageKey?: string;
  isCommittedResultValid?: (result: TResult) => boolean;
  modelVersion?: string;
}

export function useCalculatorSession<TInputs, TResult>({
  initialInputs,
  storageKey,
  isCommittedResultValid,
  modelVersion,
}: UseCalculatorSessionOptions<TInputs, TResult>) {
  const [state, dispatch] = useReducer(
    reduceCalculatorSession<TInputs, TResult>,
    initialInputs,
    createCalculatorSessionState<TInputs, TResult>,
  );
  const [calculationWorkflow] = useState(
    () =>
      new CalculatorSessionWorkflow<TInputs, TResult>({
        transitions: {
          start: () => dispatch({ type: 'start' }),
          succeed: (committedInputs, committedResult) =>
            dispatch({ type: 'succeed', committedInputs, committedResult }),
          fail: (error) => dispatch({ type: 'fail', error }),
          cancel: () => dispatch({ type: 'cancel' }),
        },
      }),
  );

  useEffect(() => () => calculationWorkflow.invalidate(), [calculationWorkflow]);

  useEffect(() => {
    if (!storageKey) {
      dispatch({ type: 'ready' });
      return;
    }
    const restored = restoreCalculatorSession(
      loadPersistedCalculatorState<PersistedCalculatorSession<TInputs, TResult>>(storageKey),
      initialInputs,
      isCommittedResultValid,
      modelVersion,
    );
    dispatch({ type: 'restore', ...restored });
    dispatch({ type: 'ready' });
  }, [initialInputs, isCommittedResultValid, modelVersion, storageKey]);

  useEffect(() => {
    if (!storageKey || !state.isPersistenceReady) return;
    savePersistedCalculatorState(
      storageKey,
      createPersistedCalculatorSession(
        state.draftInputs,
        state.committedInputs,
        state.committedResult,
        modelVersion,
      ),
    );
  }, [
    state.committedInputs,
    state.committedResult,
    state.draftInputs,
    state.isPersistenceReady,
    storageKey,
    modelVersion,
  ]);

  const setDraftInputs = useCallback(
    (draftInputs: TInputs) => dispatch({ type: 'set-draft', draftInputs }),
    [],
  );
  const clearError = useCallback(() => dispatch({ type: 'clear-error' }), []);
  const cancelCalculation = useCallback(() => {
    calculationWorkflow.cancel();
  }, [calculationWorkflow]);
  const runCalculation = useCallback(
    async (calculate: (inputs: TInputs) => Promise<TResult>) => {
      const inputsAtStart = state.draftInputs;
      return calculationWorkflow.run(inputsAtStart, calculate);
    },
    [calculationWorkflow, state.draftInputs],
  );

  return {
    ...state,
    isDirty: isCalculatorSessionDirty(state),
    setDraftInputs,
    clearError,
    cancelCalculation,
    runCalculation,
  };
}
