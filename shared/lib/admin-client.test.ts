import { describe, expect, it, vi } from 'vitest';

import { adminClient } from './admin-client';
import { apiGet, apiPost } from './api-client';

vi.mock('./api-client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

describe('admin client', () => {
  it('routes status reads with the sync secret bearer token', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({ series: [], systemTime: 'now', env: 'test' });

    await adminClient.getStatus('secret');

    expect(apiGet).toHaveBeenCalledWith('/api/admin/status', {
      headers: {
        Authorization: 'Bearer secret',
      },
    });
  });

  it('routes full sync commands with the sync secret bearer token', async () => {
    vi.mocked(apiPost).mockResolvedValueOnce({ ok: true });

    await adminClient.runSync('secret', 'full-sync');

    expect(apiPost).toHaveBeenCalledWith(
      '/api/admin/sync',
      { mode: 'full-sync' },
      {
        headers: {
          Authorization: 'Bearer secret',
        },
      },
    );
  });
});
