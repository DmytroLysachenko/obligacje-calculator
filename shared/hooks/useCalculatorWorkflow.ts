'use client';

import { useCallback } from 'react';

import { useCalculationRequest } from './useCalculationRequest';
import { useCalculatorSession } from './useCalculatorSession';

interface UseCalculatorWorkflowOptions<TInputs, TResult> {
  initialInputs: TInputs;
  storageKey?: string;
  isCommittedResultValid?: (result: TResult) => boolean;
  modelVersion?: string;
}

interface CalculationRequestOptions {
  preferWorker?: boolean;
}

/**
 * Calculator workflow seam. It owns persistence, current-request transport,
 * abort propagation, stale-result rejection, and session terminal state.
 * Scenario hooks retain only input normalization and endpoint selection.
 */
export function useCalculatorWorkflow<TInputs, TResult>(
  options: UseCalculatorWorkflowOptions<TInputs, TResult>,
) {
  const {
    cancelCalculation: cancelSessionCalculation,
    phase,
    runCalculation,
    ...sessionState
  } = useCalculatorSession<TInputs, TResult>(options);
  const {
    cancel: cancelRequest,
    clearError: clearRequestError,
    isCalculating,
    isError: isRequestError,
    post,
    requestMessage,
  } = useCalculationRequest();

  const runRemoteCalculation = useCallback(
    async (
      endpoint: string,
      toPayload: (inputs: TInputs) => unknown = (inputs) => inputs,
      requestOptions: CalculationRequestOptions = {},
    ) => {
      clearRequestError();
      return runCalculation((inputs) => post<TResult>(endpoint, toPayload(inputs), requestOptions));
    },
    [clearRequestError, post, runCalculation],
  );

  const cancelCalculation = useCallback(() => {
    // Abort transport first. The session invalidates synchronously, so a late
    // fetch/worker settlement can only be observational.
    cancelRequest();
    cancelSessionCalculation();
  }, [cancelRequest, cancelSessionCalculation]);

  return {
    ...sessionState,
    phase,
    isCalculating,
    isError: isRequestError || phase === 'failed',
    requestMessage,
    clearError: clearRequestError,
    cancelCalculation,
    runRemoteCalculation,
  };
}
