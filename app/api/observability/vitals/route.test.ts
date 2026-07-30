import { beforeEach, describe, expect, it, vi } from 'vitest';

const { info } = vi.hoisted(() => ({ info: vi.fn() }));

vi.mock('@/lib/server/logging', () => ({
  createServerLogger: () => ({ info }),
}));

import { POST } from './route';

describe('web vitals endpoint', () => {
  beforeEach(() => {
    info.mockClear();
  });

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
      navigation_type: 'navigate',
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

  it('rejects oversized telemetry before decoding it', async () => {
    const response = await POST(
      new Request('http://localhost/api/observability/vitals', {
        method: 'POST',
        headers: { 'content-length': '2049' },
        body: '{}',
      }) as never,
    );

    expect(response.status).toBe(400);
    expect(info).not.toHaveBeenCalled();
  });
});
