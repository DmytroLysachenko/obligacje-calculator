type CalculationRequestPhase = 'idle' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface CalculationRequestState {
  activeRequestId: number | null;
  completedRequestId: number | null;
  error: Error | null;
  phase: CalculationRequestPhase;
}

export type CalculationRequestEvent =
  | { type: 'start'; requestId: number }
  | { type: 'succeed'; requestId: number }
  | { type: 'fail'; requestId: number; error: Error }
  | { type: 'cancel'; requestId: number }
  | { type: 'clear-error' };

export const initialCalculationRequestState: CalculationRequestState = {
  activeRequestId: null,
  completedRequestId: null,
  error: null,
  phase: 'idle',
};

/**
 * Ignores lifecycle events from superseded requests. This is intentionally
 * pure so worker, HTTP, and component paths share the same race protection.
 */
export function reduceCalculationRequestState(
  state: CalculationRequestState,
  event: CalculationRequestEvent,
): CalculationRequestState {
  switch (event.type) {
    case 'start':
      return {
        activeRequestId: event.requestId,
        completedRequestId: state.completedRequestId,
        error: null,
        phase: 'running',
      };
    case 'clear-error':
      return { ...state, error: null, phase: state.phase === 'failed' ? 'idle' : state.phase };
    case 'succeed':
      if (state.activeRequestId !== event.requestId) {
        return state;
      }
      return {
        activeRequestId: null,
        completedRequestId: event.requestId,
        error: null,
        phase: 'succeeded',
      };
    case 'fail':
      if (state.activeRequestId !== event.requestId) {
        return state;
      }
      return {
        activeRequestId: null,
        completedRequestId: event.requestId,
        error: event.error,
        phase: 'failed',
      };
    case 'cancel':
      if (state.activeRequestId !== event.requestId) {
        return state;
      }
      return {
        activeRequestId: null,
        completedRequestId: event.requestId,
        error: null,
        phase: 'cancelled',
      };
  }
}

export function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}

export function getCalculationRequestMessage(state: CalculationRequestState) {
  if (state.phase === 'running') {
    return 'Calculation in progress.';
  }
  if (state.phase === 'cancelled') {
    return 'Calculation cancelled because newer inputs were submitted.';
  }
  if (state.phase === 'failed') {
    return state.error?.message ?? 'Calculation could not be completed.';
  }
  return null;
}
