import { describe, expect, it } from 'vitest';

import { CalculationSessionExecution } from './calculation-session-execution';

describe('calculation session execution ownership', () => {
  it('marks only the most recently started calculation as current', () => {
    const execution = new CalculationSessionExecution();
    const first = execution.start();
    const second = execution.start();
    expect(execution.isCurrent(first)).toBe(false);
    expect(execution.isCurrent(second)).toBe(true);
  });

  it('invalidates an active completion on cancellation or unmount', () => {
    const execution = new CalculationSessionExecution();
    const active = execution.start();
    execution.invalidate();
    expect(execution.isCurrent(active)).toBe(false);
  });

  it('does not make an old request current after several retries', () => {
    const execution = new CalculationSessionExecution();
    const attempts = [execution.start(), execution.start(), execution.start()];
    expect(attempts.map((attempt) => execution.isCurrent(attempt))).toEqual([false, false, true]);
  });

  it('keeps the newest completion current until another action supersedes it', () => {
    const execution = new CalculationSessionExecution();
    const active = execution.start();

    expect(execution.isCurrent(active)).toBe(true);
    expect(execution.isCurrent(active)).toBe(true);
  });

  it('does not reuse an epoch after invalidation', () => {
    const execution = new CalculationSessionExecution();
    const first = execution.start();
    execution.invalidate();
    const next = execution.start();

    expect(next).toBeGreaterThan(first);
    expect(execution.isCurrent(first)).toBe(false);
    expect(execution.isCurrent(next)).toBe(true);
  });
});
