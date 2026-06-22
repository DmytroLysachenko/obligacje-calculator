import {describe, expect, it} from 'vitest';
import {
  createdJson,
  createDomainErrorResponse,
  createUnauthorizedResponse,
  createValidationErrorResponse,
  errorJson,
  okJson,
  rawJson,
} from '@/lib/server/http/responses';

describe('http response helpers', () => {
  it('supports raw operational payloads for platform endpoints', async () => {
    const response = rawJson({ok: true, service: 'health'});

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ok: true, service: 'health'});
  });

  it('wraps success payloads consistently', async () => {
    const response = okJson({value: 1});

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {value: 1},
      meta: {version: '1.2.0'},
    });
  });

  it('supports created success responses', async () => {
    const response = createdJson({id: 'new'});

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      data: {id: 'new'},
    });
  });

  it('wraps generic API errors consistently', async () => {
    const response = errorJson('Nope', 'NOPE', {field: 'x'}, {status: 409});

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        message: 'Nope',
        code: 'NOPE',
        details: {field: 'x'},
      },
    });
  });

  it('creates unauthorized responses', async () => {
    const response = createUnauthorizedResponse();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({error: 'Unauthorized'});
  });

  it('creates validation problem responses', async () => {
    const response = createValidationErrorResponse('Portfolio ID is required', 'MISSING_PARAM');

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        message: 'Portfolio ID is required',
        code: 'MISSING_PARAM',
      },
    });
  });

  it('creates domain error responses', async () => {
    const response = createDomainErrorResponse({
      message: 'Portfolio not found',
      code: 'NOT_FOUND',
      status: 404,
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        message: 'Portfolio not found',
        code: 'NOT_FOUND',
      },
    });
  });
});
