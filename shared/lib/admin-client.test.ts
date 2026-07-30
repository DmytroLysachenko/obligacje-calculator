import { describe, expect, it, vi } from 'vitest';

import { adminClient } from './admin-client';
import { apiGet, apiPost } from './api-client';

vi.mock('./api-client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

describe('admin client', () => {
  it('routes status reads through the authenticated browser session', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({ series: [], systemTime: 'now', env: 'test' });

    await adminClient.getStatus();

    expect(apiGet).toHaveBeenCalledWith('/api/admin/status');
  });

  it('routes full sync commands through the authenticated browser session', async () => {
    vi.mocked(apiPost).mockResolvedValueOnce({ ok: true });

    await adminClient.runSync('full-sync');

    expect(apiPost).toHaveBeenCalledWith('/api/admin/sync', { mode: 'full-sync' });
  });
});
