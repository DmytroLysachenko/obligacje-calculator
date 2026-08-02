import { describe, expect, it } from 'vitest';

import {
  createCalculatorSessionState,
  isCalculatorSessionDirty,
  reduceCalculatorSession,
} from './calculator-session';

describe('calculator session state', () => {
  it('keeps a committed result while a user edits a draft', () => {
    const initial = createCalculatorSessionState<{ amount: number }, { total: number }>({
      amount: 100,
    });
    const committed = reduceCalculatorSession(initial, {
      type: 'succeed',
      committedInputs: { amount: 100 },
      committedResult: { total: 110 },
    });
    const edited = reduceCalculatorSession(committed, {
      type: 'set-draft',
      draftInputs: { amount: 200 },
    });

    expect(edited.committedResult).toEqual({ total: 110 });
    expect(edited.committedInputs).toEqual({ amount: 100 });
    expect(edited.draftInputs).toEqual({ amount: 200 });
    expect(isCalculatorSessionDirty(edited)).toBe(true);
  });

  it('commits only an explicit successful calculation', () => {
    const initial = createCalculatorSessionState<{ amount: number }, number>({ amount: 100 });
    const running = reduceCalculatorSession(initial, { type: 'start' });
    const completed = reduceCalculatorSession(running, {
      type: 'succeed',
      committedInputs: { amount: 100 },
      committedResult: 105,
    });

    expect(running.committedResult).toBeNull();
    expect(completed.committedResult).toBe(105);
    expect(isCalculatorSessionDirty(completed)).toBe(false);
  });

  it('does not discard a committed result after failure or cancellation', () => {
    const initial = reduceCalculatorSession(
      createCalculatorSessionState<{ amount: number }, number>({ amount: 100 }),
      { type: 'succeed', committedInputs: { amount: 100 }, committedResult: 105 },
    );
    const failed = reduceCalculatorSession(initial, { type: 'fail', error: new Error('network') });
    const cancelled = reduceCalculatorSession(failed, { type: 'cancel' });

    expect(failed.committedResult).toBe(105);
    expect(cancelled.committedResult).toBe(105);
    expect(cancelled.error).toBeNull();
  });

  it('restores a draft and committed snapshot independently', () => {
    const initial = createCalculatorSessionState<{ amount: number }, number>({ amount: 1 });
    const restored = reduceCalculatorSession(initial, {
      type: 'restore',
      draftInputs: { amount: 120 },
      committedInputs: { amount: 100 },
      committedResult: 111,
    });

    expect(restored.draftInputs).toEqual({ amount: 120 });
    expect(restored.committedInputs).toEqual({ amount: 100 });
    expect(restored.committedResult).toBe(111);
    expect(isCalculatorSessionDirty(restored)).toBe(true);
  });

  it('tracks persistence readiness without changing calculation state', () => {
    const initial = createCalculatorSessionState<{ amount: number }, number>({ amount: 10 });
    const ready = reduceCalculatorSession(initial, { type: 'ready' });

    expect(ready.isPersistenceReady).toBe(true);
    expect(ready.draftInputs).toEqual({ amount: 10 });
    expect(ready.committedResult).toBeNull();
  });
});
