import { describe, expect, it, vi } from 'vitest';

const { info } = vi.hoisted(() => ({ info: vi.fn() }));

vi.mock('@/lib/server/logging', () => ({
  createServerLogger: () => ({ info }),
}));

import { POST } from './route';

describe('web vitals endpoint', () => {
  it('logs only validated anonymous metric fields', async () => {
    const response = await POST(
      new Request('http://localhost/api/observability/vitals', {
        method: 'POST',
        body: JSON.stringify({ name: 'LCP', value: 1240, rating: 'good', path: '/education' }),
      }) as never,
    );

    expect(response.status).toBe(204);
    expect(info).toHaveBeenCalledWith('web_vital', {
      event: 'web_vital',
      metric: 'LCP',
      value: 1240,
      rating: 'good',
      path: '/education',
    });
  });

  it('rejects query strings and arbitrary user data', async () => {
    const response = await POST(
      new Request('http://localhost/api/observability/vitals', {
        method: 'POST',
        body: JSON.stringify({ name: 'LCP', value: 1, rating: 'good', path: '/?email=test@example.com' }),
      }) as never,
    );

    expect(response.status).toBe(400);
  });
});
