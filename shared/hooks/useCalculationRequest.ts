'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';

import { CalculationCancelled } from '@/shared/lib/calculation-cancelled';
import {
  type CalculationClientErrorPayload,
  postCalculation,
} from '@/shared/lib/calculation-client';
import {
  getCalculationRequestMessage,
  initialCalculationRequestState,
  isAbortError,
  reduceCalculationRequestState,
} from '@/shared/lib/calculation-request-state';
import { postCalculationInWorker } from '@/shared/lib/calculation-worker-client';

interface CalculationRequestOptions {
  preferWorker?: boolean;
}

export { CalculationCancelled };

export function useCalculationRequest() {
  const [state, dispatch] = useReducer(
    reduceCalculationRequestState,
    initialCalculationRequestState,
  );
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const clearCurrentRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    if (!abortControllerRef.current) return;
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
    dispatch({ type: 'cancel', requestId: requestIdRef.current });
  }, []);

  useEffect(() => {
    return () => clearCurrentRequest();
  }, [clearCurrentRequest]);

  const run = useCallback(
    async <T>(request: (signal: AbortSignal) => Promise<T>): Promise<T> => {
      clearCurrentRequest();

      const controller = new AbortController();
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      abortControllerRef.current = controller;

      dispatch({ type: 'start', requestId });

      try {
        const result = await request(controller.signal);
        // A fetch adapter is not required to observe AbortSignal. Do not let a
        // late resolution leak through to a caller that would commit it.
        if (controller.signal.aborted || requestIdRef.current !== requestId) {
          throw new CalculationCancelled();
        }
        dispatch({ type: 'succeed', requestId });
        return result;
      } catch (error) {
        if (isAbortError(error) || error instanceof CalculationCancelled) {
          if (requestIdRef.current === requestId) {
            dispatch({ type: 'cancel', requestId });
          }
          throw new CalculationCancelled();
        }
        dispatch({
          type: 'fail',
          requestId,
          error: error instanceof Error ? error : new Error(String(error)),
        });
        throw error;
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [clearCurrentRequest],
  );

  const clearError = useCallback(() => {
    dispatch({ type: 'clear-error' });
  }, []);

  return {
    isCalculating: state.phase === 'running',
    isError: state.phase === 'failed',
    requestState: state,
    requestMessage: getCalculationRequestMessage(state),
    run,
    cancel,
    clearError,
    post: useCallback(
      async <T>(
        url: string,
        payload: unknown,
        options: CalculationRequestOptions = {},
      ): Promise<T> => {
        return run(async (signal) => {
          if (options.preferWorker) {
            try {
              return await postCalculationInWorker<T>(url, payload, signal);
            } catch (error) {
              const typedError = error as CalculationClientErrorPayload & { name?: string };
              if (typedError?.name !== 'CalculationClientError') {
                throw error;
              }
            }
          }

          return await postCalculation<T>(url, payload, signal);
        });
      },
      [run],
    ),
  };
}
