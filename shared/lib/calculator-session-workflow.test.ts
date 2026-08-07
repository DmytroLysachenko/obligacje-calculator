import { describe, expect, it, vi } from 'vitest';

import { CalculationCancelled } from './calculation-cancelled';
import {
  type CalculationWorkflowTransitions,
  CalculatorSessionWorkflow,
} from './calculator-session-workflow';

interface Inputs {
  amount: number;
}

interface Result {
  value: number;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, reject, resolve };
}

function createTransitions() {
  const transitions: CalculationWorkflowTransitions<Inputs, Result> = {
    start: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn(),
    cancel: vi.fn(),
  };
  return transitions;
}

describe('CalculatorSessionWorkflow', () => {
  it('starts then commits exact input snapshot and result', async () => {
    const transitions = createTransitions();
    const workflow = new CalculatorSessionWorkflow({ transitions });
    const input = { amount: 100 };
    const result = { value: 109 };

    await expect(
      workflow.run(input, async (received) => {
        expect(received).toBe(input);
        return result;
      }),
    ).resolves.toEqual({ kind: 'committed', result });

    expect(transitions.start).toHaveBeenCalledTimes(1);
    expect(transitions.succeed).toHaveBeenCalledWith(input, result);
    expect(transitions.fail).not.toHaveBeenCalled();
    expect(transitions.cancel).not.toHaveBeenCalled();
  });

  it('preserves error identity while notifying state transition', async () => {
    const transitions = createTransitions();
    const workflow = new CalculatorSessionWorkflow({ transitions });
    const error = new Error('provider unavailable');

    await expect(workflow.run({ amount: 100 }, async () => Promise.reject(error))).rejects.toBe(
      error,
    );
    expect(transitions.fail).toHaveBeenCalledWith(error);
    expect(transitions.succeed).not.toHaveBeenCalled();
    expect(transitions.cancel).not.toHaveBeenCalled();
  });

  it('normalizes a non-Error failure only for state display', async () => {
    const transitions = createTransitions();
    const workflow = new CalculatorSessionWorkflow({ transitions });

    await expect(
      workflow.run({ amount: 100 }, async () => Promise.reject('network disconnected')),
    ).rejects.toBe('network disconnected');
    expect(transitions.fail).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'network disconnected' }),
    );
  });

  it('models cancellation as a non-success terminal outcome', async () => {
    const transitions = createTransitions();
    const workflow = new CalculatorSessionWorkflow({ transitions });

    await expect(
      workflow.run({ amount: 100 }, async () => Promise.reject(new CalculationCancelled())),
    ).resolves.toEqual({ kind: 'cancelled' });
    expect(transitions.cancel).toHaveBeenCalledTimes(1);
    expect(transitions.succeed).not.toHaveBeenCalled();
    expect(transitions.fail).not.toHaveBeenCalled();
  });

  it('supports an injected cancellation signal at an adapter boundary', async () => {
    const transitions = createTransitions();
    const workflow = new CalculatorSessionWorkflow({
      transitions,
      isCancellation: (error) => error === 'abort-sentinel',
    });

    await expect(
      workflow.run({ amount: 100 }, async () => Promise.reject('abort-sentinel')),
    ).resolves.toEqual({ kind: 'cancelled' });
    expect(transitions.cancel).toHaveBeenCalledTimes(1);
  });

  it('does not commit a result after explicit cancellation', async () => {
    const transitions = createTransitions();
    const workflow = new CalculatorSessionWorkflow({ transitions });
    const pending = deferred<Result>();
    const running = workflow.run({ amount: 100 }, () => pending.promise);

    workflow.cancel();
    pending.resolve({ value: 109 });

    await expect(running).resolves.toEqual({ kind: 'superseded', result: { value: 109 } });
    expect(transitions.cancel).toHaveBeenCalledTimes(1);
    expect(transitions.succeed).not.toHaveBeenCalled();
    expect(transitions.fail).not.toHaveBeenCalled();
  });

  it('does not report a stale failure after explicit cancellation', async () => {
    const transitions = createTransitions();
    const workflow = new CalculatorSessionWorkflow({ transitions });
    const pending = deferred<Result>();
    const running = workflow.run({ amount: 100 }, () => pending.promise);

    workflow.cancel();
    pending.reject(new Error('late network failure'));

    await expect(running).resolves.toEqual({ kind: 'superseded' });
    expect(transitions.cancel).toHaveBeenCalledTimes(1);
    expect(transitions.fail).not.toHaveBeenCalled();
  });

  it('marks first completion superseded after a newer calculation begins', async () => {
    const transitions = createTransitions();
    const workflow = new CalculatorSessionWorkflow({ transitions });
    const first = deferred<Result>();
    const second = deferred<Result>();

    const firstRun = workflow.run({ amount: 100 }, () => first.promise);
    const secondRun = workflow.run({ amount: 200 }, () => second.promise);
    second.resolve({ value: 218 });
    first.resolve({ value: 109 });

    await expect(secondRun).resolves.toEqual({ kind: 'committed', result: { value: 218 } });
    await expect(firstRun).resolves.toEqual({ kind: 'superseded', result: { value: 109 } });
    expect(transitions.start).toHaveBeenCalledTimes(2);
    expect(transitions.succeed).toHaveBeenCalledTimes(1);
    expect(transitions.succeed).toHaveBeenCalledWith({ amount: 200 }, { value: 218 });
  });

  it('does not publish a late failure after a newer calculation commits', async () => {
    const transitions = createTransitions();
    const workflow = new CalculatorSessionWorkflow({ transitions });
    const first = deferred<Result>();

    const firstRun = workflow.run({ amount: 100 }, () => first.promise);
    const secondRun = workflow.run({ amount: 200 }, async () => ({ value: 218 }));
    first.reject(new Error('late provider failure'));

    await expect(secondRun).resolves.toEqual({ kind: 'committed', result: { value: 218 } });
    await expect(firstRun).resolves.toEqual({ kind: 'superseded' });
    expect(transitions.succeed).toHaveBeenCalledTimes(1);
    expect(transitions.fail).not.toHaveBeenCalled();
  });

  it('does not publish cancellation from a superseded calculation', async () => {
    const transitions = createTransitions();
    const workflow = new CalculatorSessionWorkflow({ transitions });
    const first = deferred<Result>();

    const firstRun = workflow.run({ amount: 100 }, () => first.promise);
    const secondRun = workflow.run({ amount: 200 }, async () => ({ value: 218 }));
    first.reject(new CalculationCancelled());

    await expect(secondRun).resolves.toEqual({ kind: 'committed', result: { value: 218 } });
    await expect(firstRun).resolves.toEqual({ kind: 'superseded' });
    expect(transitions.cancel).not.toHaveBeenCalled();
  });

  it('invalidates unmounted work without dispatching a transition', async () => {
    const transitions = createTransitions();
    const workflow = new CalculatorSessionWorkflow({ transitions });
    const pending = deferred<Result>();
    const running = workflow.run({ amount: 100 }, () => pending.promise);

    workflow.invalidate();
    pending.resolve({ value: 109 });

    await expect(running).resolves.toEqual({ kind: 'superseded', result: { value: 109 } });
    expect(transitions.cancel).not.toHaveBeenCalled();
    expect(transitions.succeed).not.toHaveBeenCalled();
    expect(transitions.fail).not.toHaveBeenCalled();
  });

  it('permits a fresh calculation after cancellation', async () => {
    const transitions = createTransitions();
    const workflow = new CalculatorSessionWorkflow({ transitions });
    const pending = deferred<Result>();
    const cancelled = workflow.run({ amount: 100 }, () => pending.promise);

    workflow.cancel();
    pending.reject(new CalculationCancelled());

    await expect(cancelled).resolves.toEqual({ kind: 'superseded' });
    await expect(workflow.run({ amount: 200 }, async () => ({ value: 218 }))).resolves.toEqual({
      kind: 'committed',
      result: { value: 218 },
    });
    expect(transitions.succeed).toHaveBeenCalledWith({ amount: 200 }, { value: 218 });
  });
});
