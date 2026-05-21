import {describe, expect, it} from 'vitest';
import {
  createDomainErrorResponse,
  createUnauthorizedResponse,
  createValidationErrorResponse,
} from '@/lib/server/http/responses';

describe('http response helpers', () => {
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
