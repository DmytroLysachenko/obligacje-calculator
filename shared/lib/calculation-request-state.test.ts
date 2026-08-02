import { describe, expect, it } from 'vitest';

import {
  getCalculationRequestMessage,
  initialCalculationRequestState,
  reduceCalculationRequestState,
} from './calculation-request-state';

describe('calculation request state', () => {
  it('keeps the newest request active when an older request finishes', () => {
    const runningFirst = reduceCalculationRequestState(initialCalculationRequestState, {
      type: 'start',
      requestId: 1,
    });
    const runningSecond = reduceCalculationRequestState(runningFirst, {
      type: 'start',
      requestId: 2,
    });

    expect(reduceCalculationRequestState(runningSecond, { type: 'succeed', requestId: 1 })).toBe(
      runningSecond,
    );
    expect(
      reduceCalculationRequestState(runningSecond, { type: 'succeed', requestId: 2 }),
    ).toMatchObject({
      phase: 'succeeded',
      completedRequestId: 2,
    });
  });

  it('keeps cancellation distinct from a user-visible failure', () => {
    const running = reduceCalculationRequestState(initialCalculationRequestState, {
      type: 'start',
      requestId: 1,
    });
    const cancelled = reduceCalculationRequestState(running, { type: 'cancel', requestId: 1 });

    expect(cancelled).toMatchObject({ phase: 'cancelled', error: null });
    expect(getCalculationRequestMessage(cancelled)).toMatch(/cancelled/i);
  });

  it('retains the failure reason until a user clears it', () => {
    const running = reduceCalculationRequestState(initialCalculationRequestState, {
      type: 'start',
      requestId: 4,
    });
    const failed = reduceCalculationRequestState(running, {
      type: 'fail',
      requestId: 4,
      error: new Error('Network unavailable'),
    });

    expect(getCalculationRequestMessage(failed)).toBe('Network unavailable');
    expect(reduceCalculationRequestState(failed, { type: 'clear-error' })).toMatchObject({
      phase: 'idle',
      error: null,
    });
  });
});
