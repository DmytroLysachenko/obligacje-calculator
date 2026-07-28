export type CalculatorSessionPhase = 'idle' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface CalculatorSessionState<TInputs, TResult> {
  draftInputs: TInputs;
  committedInputs: TInputs | null;
  committedResult: TResult | null;
  error: Error | null;
  phase: CalculatorSessionPhase;
  isPersistenceReady: boolean;
}

export type CalculatorSessionEvent<TInputs, TResult> =
  | {
      type: 'restore';
      draftInputs: TInputs;
      committedInputs: TInputs | null;
      committedResult: TResult | null;
    }
  | { type: 'set-draft'; draftInputs: TInputs }
  | { type: 'start' }
  | { type: 'succeed'; committedInputs: TInputs; committedResult: TResult }
  | { type: 'fail'; error: Error }
  | { type: 'cancel' }
  | { type: 'clear-error' }
  | { type: 'ready' };

export function createCalculatorSessionState<TInputs, TResult>(
  draftInputs: TInputs,
): CalculatorSessionState<TInputs, TResult> {
  return {
    draftInputs,
    committedInputs: null,
    committedResult: null,
    error: null,
    phase: 'idle',
    isPersistenceReady: false,
  };
}

export function reduceCalculatorSession<TInputs, TResult>(
  state: CalculatorSessionState<TInputs, TResult>,
  event: CalculatorSessionEvent<TInputs, TResult>,
): CalculatorSessionState<TInputs, TResult> {
  switch (event.type) {
    case 'restore':
      return {
        ...state,
        draftInputs: event.draftInputs,
        committedInputs: event.committedInputs,
        committedResult: event.committedResult,
      };
    case 'set-draft':
      return {
        ...state,
        draftInputs: event.draftInputs,
        error: null,
        phase: state.phase === 'failed' ? 'idle' : state.phase,
      };
    case 'start':
      return { ...state, error: null, phase: 'running' };
    case 'succeed':
      return {
        ...state,
        committedInputs: event.committedInputs,
        committedResult: event.committedResult,
        error: null,
        phase: 'succeeded',
      };
    case 'fail':
      return { ...state, error: event.error, phase: 'failed' };
    case 'cancel':
      return { ...state, error: null, phase: 'cancelled' };
    case 'clear-error':
      return { ...state, error: null, phase: state.phase === 'failed' ? 'idle' : state.phase };
    case 'ready':
      return { ...state, isPersistenceReady: true };
  }
}

export function isCalculatorSessionDirty<TInputs, TResult>(
  state: CalculatorSessionState<TInputs, TResult>,
) {
  return (
    state.committedInputs === null ||
    JSON.stringify(state.draftInputs) !== JSON.stringify(state.committedInputs)
  );
}
