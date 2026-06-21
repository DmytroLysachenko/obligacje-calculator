import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSyncJson, fetchSyncResponse, fetchSyncText } from './http-gateway';

describe('sync http gateway', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('adds default provider headers and returns parsed json', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchSyncJson<{ ok: boolean }>('https://example.com/data')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/data',
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/json',
          'User-Agent': 'obligacje-calculator/1.0',
        }),
      }),
    );
  });

  it('throws classified http errors by default', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', {
      status: 503,
      statusText: 'Service Unavailable',
    })));

    await expect(fetchSyncText('https://example.com/down')).rejects.toThrow(
      'External fetch failed: 503 Service Unavailable',
    );
  });

  it('can preserve fallback-style provider handling for bad statuses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));

    const response = await fetchSyncResponse('https://example.com/missing', {
      throwOnHttpError: false,
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
  });
});
