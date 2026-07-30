'use client';

import { useCallback, useEffect, useReducer } from 'react';

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

import { CalculationCancelled } from './useCalculationRequest';

interface UseCalculatorSessionOptions<TInputs, TResult> {
  initialInputs: TInputs;
  storageKey?: string;
  isCommittedResultValid?: (result: TResult) => boolean;
}

export function useCalculatorSession<TInputs, TResult>({
  initialInputs,
  storageKey,
  isCommittedResultValid,
}: UseCalculatorSessionOptions<TInputs, TResult>) {
  const [state, dispatch] = useReducer(
    reduceCalculatorSession<TInputs, TResult>,
    initialInputs,
    createCalculatorSessionState<TInputs, TResult>,
  );

  useEffect(() => {
    if (!storageKey) {
      dispatch({ type: 'ready' });
      return;
    }
    const restored = restoreCalculatorSession(
      loadPersistedCalculatorState<PersistedCalculatorSession<TInputs, TResult>>(storageKey),
      initialInputs,
      isCommittedResultValid,
    );
    dispatch({ type: 'restore', ...restored });
    dispatch({ type: 'ready' });
  }, [initialInputs, isCommittedResultValid, storageKey]);

  useEffect(() => {
    if (!storageKey || !state.isPersistenceReady) return;
    savePersistedCalculatorState(
      storageKey,
      createPersistedCalculatorSession(
        state.draftInputs,
        state.committedInputs,
        state.committedResult,
      ),
    );
  }, [
    state.committedInputs,
    state.committedResult,
    state.draftInputs,
    state.isPersistenceReady,
    storageKey,
  ]);

  const setDraftInputs = useCallback(
    (draftInputs: TInputs) => dispatch({ type: 'set-draft', draftInputs }),
    [],
  );
  const clearError = useCallback(() => dispatch({ type: 'clear-error' }), []);
  const runCalculation = useCallback(
    async (calculate: (inputs: TInputs) => Promise<TResult>) => {
      dispatch({ type: 'start' });
      try {
        const result = await calculate(state.draftInputs);
        dispatch({ type: 'succeed', committedInputs: state.draftInputs, committedResult: result });
        return result;
      } catch (error) {
        if (error instanceof CalculationCancelled) {
          return undefined;
        }
        dispatch({
          type: 'fail',
          error: error instanceof Error ? error : new Error(String(error)),
        });
        throw error;
      }
    },
    [state.draftInputs],
  );

  return {
    ...state,
    isDirty: isCalculatorSessionDirty(state),
    setDraftInputs,
    clearError,
    runCalculation,
  };
}
