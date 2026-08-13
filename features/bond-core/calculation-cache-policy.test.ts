import { describe, expect, it, vi } from 'vitest';

import { CalculationCachePolicy } from './calculation-cache-policy';

function createPolicy(cached: unknown = undefined) {
  const cache = {
    generateKey: vi.fn(() => 'revision-aware-key'),
    get: vi.fn(() => cached),
    set: vi.fn(),
    invalidateNamespace: vi.fn(),
  };
  return { cache, policy: new CalculationCachePolicy({ cache, modelVersion: 'model:42' }) };
}

describe('CalculationCachePolicy', () => {
  it('generates cache identity from model, request, and revision', async () => {
    const { cache, policy } = createPolicy();
    await policy.getOrCalculate({
      request: { kind: 'single', payload: { amount: 100 } },
      dataRevision: 'offers:2|tax:4',
      calculate: async () => ({ amount: 101 }),
    });

    expect(cache.generateKey).toHaveBeenCalledWith({
      modelVersion: 'model:42',
      request: { kind: 'single', payload: { amount: 100 } },
      dataRevision: 'offers:2|tax:4',
    });
  });

  it('returns cached values without invoking calculation', async () => {
    const cached = { amount: 101 };
    const { cache, policy } = createPolicy(cached);
    const calculate = vi.fn(async () => ({ amount: 999 }));

    await expect(
      policy.getOrCalculate({ request: {}, dataRevision: 'r1', calculate }),
    ).resolves.toBe(cached);
    expect(calculate).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('writes only successful calculated values', async () => {
    const { cache, policy } = createPolicy();
    const expected = { amount: 101 };
    await expect(
      policy.getOrCalculate({ request: {}, dataRevision: 'r1', calculate: async () => expected }),
    ).resolves.toBe(expected);
    expect(cache.set).toHaveBeenCalledWith('revision-aware-key', expected, 5 * 60_000);

    cache.set.mockClear();
    await expect(
      policy.getOrCalculate({
        request: {},
        dataRevision: 'r2',
        calculate: async () => Promise.reject(new Error('provider failed')),
      }),
    ).rejects.toThrow('provider failed');
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('uses an explicit bounded policy TTL instead of letting callers choose cache lifetime', async () => {
    const { cache } = createPolicy();
    const policy = new CalculationCachePolicy({ cache, modelVersion: 'model:42', ttlMs: 30_000 });

    await policy.getOrCalculate({ request: {}, dataRevision: 'r1', calculate: async () => ({}) });

    expect(cache.set).toHaveBeenCalledWith('revision-aware-key', {}, 30_000);
  });

  it('delegates namespace invalidation without exposing cache mechanism', () => {
    const { cache, policy } = createPolicy();
    policy.invalidate('authoritative:');
    expect(cache.invalidateNamespace).toHaveBeenCalledWith('authoritative:');
  });
});
