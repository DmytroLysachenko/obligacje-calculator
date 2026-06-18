import { describe, expect, it, vi } from 'vitest';
import { apiGet, apiPost } from './api-client';

describe('api client', () => {
  it('unwraps typed success payloads', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { value: 42 } }), { status: 200 }),
    );

    await expect(apiGet<{ value: number }>('/api/example')).resolves.toEqual({ value: 42 });
    expect(fetchMock).toHaveBeenCalledWith('/api/example', {
      method: 'GET',
      headers: undefined,
      signal: undefined,
    });

    fetchMock.mockRestore();
  });

  it('throws normalized API errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: { message: 'Nope', code: 'NOPE', details: { field: 'x' } },
        }),
        { status: 400 },
      ),
    );

    await expect(apiPost('/api/example', { value: 1 })).rejects.toMatchObject({
      name: 'ApiClientError',
      message: 'Nope',
      status: 400,
      code: 'NOPE',
      details: { field: 'x' },
    });

    vi.restoreAllMocks();
  });
});
