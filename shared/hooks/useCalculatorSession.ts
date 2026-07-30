'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';

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
import { CalculationSessionExecution } from '@/shared/lib/calculation-session-execution';

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
  const calculationExecutionRef = useRef(new CalculationSessionExecution());

  useEffect(() => () => calculationExecutionRef.current.invalidate(), []);

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
      const epoch = calculationExecutionRef.current.start();
      const inputsAtStart = state.draftInputs;
      dispatch({ type: 'start' });
      try {
        const result = await calculate(inputsAtStart);
        if (!calculationExecutionRef.current.isCurrent(epoch)) return result;
        dispatch({ type: 'succeed', committedInputs: inputsAtStart, committedResult: result });
        return result;
      } catch (error) {
        if (error instanceof CalculationCancelled) {
          if (calculationExecutionRef.current.isCurrent(epoch)) dispatch({ type: 'cancel' });
          return undefined;
        }
        if (!calculationExecutionRef.current.isCurrent(epoch)) throw error;
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
