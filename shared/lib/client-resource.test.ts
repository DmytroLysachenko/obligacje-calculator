import { describe, expect, it, vi } from 'vitest';

import { ClientResource } from './client-resource';

describe('ClientResource', () => {
  it('deduplicates concurrent loads and publishes the resolved value', async () => {
    const resource = new ClientResource<number>({ maxAgeMs: 60_000 });
    let resolve!: (value: number) => void;
    const fetcher = vi.fn(
      () =>
        new Promise<number>((resolvePromise) => {
          resolve = resolvePromise;
        }),
    );

    const first = resource.load(fetcher);
    const second = resource.load(fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(resource.getSnapshot().status).toBe('loading');

    resolve(42);
    await expect(first).resolves.toBe(42);
    await expect(second).resolves.toBe(42);
    expect(resource.getSnapshot()).toMatchObject({ data: 42, error: null, status: 'ready' });
  });

  it('reuses fresh data until explicitly refreshed', async () => {
    const resource = new ClientResource<number>({ maxAgeMs: 60_000 });
    const fetcher = vi.fn().mockResolvedValueOnce(10).mockResolvedValueOnce(20);

    await resource.load(fetcher);
    await expect(resource.load(fetcher)).resolves.toBe(10);
    await expect(resource.load(fetcher, { force: true })).resolves.toBe(20);

    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('keeps stale data visible when a refresh fails', async () => {
    const resource = new ClientResource<number>({ maxAgeMs: 0 });
    await resource.load(async () => 10);

    await expect(resource.load(async () => Promise.reject(new Error('offline')))).rejects.toThrow(
      'offline',
    );

    expect(resource.getSnapshot()).toMatchObject({ data: 10, status: 'stale' });
    expect(resource.getSnapshot().error?.message).toBe('offline');
  });

  it('notifies subscribers for load, ready, invalidated, and cleared states', async () => {
    const resource = new ClientResource<string>({ maxAgeMs: 60_000 });
    const statuses: string[] = [];
    const unsubscribe = resource.subscribe((snapshot) => statuses.push(snapshot.status));

    await resource.load(async () => 'offer');
    resource.invalidate();
    resource.clear();
    unsubscribe();

    expect(statuses).toEqual(['loading', 'ready', 'stale', 'idle']);
  });

  it('stops notifying a listener once it is unsubscribed', async () => {
    const resource = new ClientResource<string>({ maxAgeMs: 60_000 });
    const listener = vi.fn();
    const unsubscribe = resource.subscribe(listener);

    unsubscribe();
    await resource.load(async () => 'offer');

    expect(listener).not.toHaveBeenCalled();
  });
});
