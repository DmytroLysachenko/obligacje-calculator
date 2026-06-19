import { describe, expect, it, vi } from 'vitest';
import { syncClient } from './sync-client';
import { apiGet } from './api-client';

vi.mock('./api-client', () => ({
  apiGet: vi.fn(),
}));

describe('sync client', () => {
  it('triggers opportunistic sync through the shared API client', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({ status: 'triggered' });

    await expect(syncClient.triggerOpportunisticSync()).resolves.toEqual({ status: 'triggered' });

    expect(apiGet).toHaveBeenCalledWith('/api/sync/opportunistic');
  });
});
