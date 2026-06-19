import { describe, expect, it, vi } from 'vitest';
import { syncClient } from './sync-client';

describe('sync client', () => {
  it('triggers opportunistic sync through the centralized client', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'triggered' }), { status: 200 }),
    );

    await syncClient.triggerOpportunisticSync();

    expect(fetchMock).toHaveBeenCalledWith('/api/sync/opportunistic');
    fetchMock.mockRestore();
  });
});
