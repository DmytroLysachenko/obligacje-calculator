import { describe, expect, it } from 'vitest';

import { CalculationWorkerControllerRegistry } from './calculation-worker-controller-registry';

describe('CalculationWorkerControllerRegistry', () => {
  it('bounds concurrent controllers and frees capacity on completion or abort', () => {
    const registry = new CalculationWorkerControllerRegistry(2);
    const first = registry.start('first');
    const second = registry.start('second');

    expect(first).toBeInstanceOf(AbortController);
    expect(second).toBeInstanceOf(AbortController);
    expect(registry.start('overflow')).toBeNull();

    registry.finish('first');
    expect(registry.start('replacement')).toBeInstanceOf(AbortController);
    expect(registry.abort('second')).toBe(true);
    expect(second?.signal.aborted).toBe(true);
    expect(registry.size).toBe(1);
  });
});
