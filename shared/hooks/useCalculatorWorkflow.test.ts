import { describe, expect, it, vi } from 'vitest';

import { CalculationCancelled } from '@/shared/lib/calculation-cancelled';
import { CalculatorSessionWorkflow } from '@/shared/lib/calculator-session-workflow';

describe('calculator workflow ownership contract', () => {
  it('keeps cancelled transport from committing a result', async () => {
    const transitions = { start: vi.fn(), succeed: vi.fn(), fail: vi.fn(), cancel: vi.fn() };
    const workflow = new CalculatorSessionWorkflow<number, number>({ transitions });

    await expect(
      workflow.run(10, async () => Promise.reject(new CalculationCancelled())),
    ).resolves.toEqual({
      kind: 'cancelled',
    });
    expect(transitions.succeed).not.toHaveBeenCalled();
    expect(transitions.fail).not.toHaveBeenCalled();
    expect(transitions.cancel).toHaveBeenCalledTimes(1);
  });

  it('keeps a prior committed snapshot when a newer operation is cancelled', async () => {
    const transitions = { start: vi.fn(), succeed: vi.fn(), fail: vi.fn(), cancel: vi.fn() };
    const workflow = new CalculatorSessionWorkflow<number, number>({ transitions });
    await workflow.run(10, async () => 20);
    const pending = workflow.run(30, () => new Promise<number>(() => undefined));
    workflow.cancel();

    expect(transitions.succeed).toHaveBeenCalledWith(10, 20);
    expect(transitions.succeed).toHaveBeenCalledTimes(1);
    expect(transitions.cancel).toHaveBeenCalledTimes(1);
    void pending;
  });
});
