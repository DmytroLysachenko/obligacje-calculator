import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { CalculationDomainError } from '@/features/bond-core/errors';
import {
  createProblemDetails,
  isJsonSyntaxError,
  mapApiErrorToProblemDetails,
} from './problem-details';

describe('problem detail mapping', () => {
  it('creates stable RFC-style problem details', () => {
    expect(
      createProblemDetails({
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid.',
        code: 'BAD',
      }),
    ).toEqual({
      type: 'https://api.obligacje.pl/errors/bad-request',
      title: 'Bad Request',
      status: 400,
      detail: 'Invalid.',
      code: 'BAD',
      errors: undefined,
    });
  });

  it('maps zod validation errors to 400 with issue details', () => {
    const schema = z.object({ amount: z.number().min(1) });
    const parsed = schema.safeParse({ amount: 0 });

    if (parsed.success) {
      throw new Error('Expected schema parse failure.');
    }

    const problem = mapApiErrorToProblemDetails(parsed.error);

    expect(problem.status).toBe(400);
    expect(problem.code).toBe('VALIDATION_ERROR');
    expect(problem.errors).toEqual(parsed.error.issues);
  });

  it('maps malformed JSON syntax errors to 400', () => {
    const error = new SyntaxError('Unexpected token } in JSON at position 3');

    expect(isJsonSyntaxError(error)).toBe(true);
    expect(mapApiErrorToProblemDetails(error)).toMatchObject({
      status: 400,
      code: 'MALFORMED_JSON',
      detail: 'The request body must be valid JSON.',
    });
  });

  it('maps calculation domain errors to 422 without stack details', () => {
    const error = new CalculationDomainError({
      code: 'CALCULATION_NUMERIC_FAULT',
      message: 'Unsafe numeric value detected at result.totalProfit',
      details: { path: 'result.totalProfit' },
    });

    expect(mapApiErrorToProblemDetails(error)).toEqual({
      type: 'https://api.obligacje.pl/errors/calculation-failed',
      title: 'Calculation Failed',
      status: 422,
      detail: 'Unsafe numeric value detected at result.totalProfit',
      code: 'CALCULATION_NUMERIC_FAULT',
      errors: { path: 'result.totalProfit' },
    });
  });

  it('hides internal error messages outside development mapping', () => {
    const problem = mapApiErrorToProblemDetails(new Error('database password leaked'));

    expect(problem.status).toBe(500);
    expect(problem.detail).toBe('An unexpected internal error occurred. Please try again later.');
    expect(problem.detail).not.toContain('password');
  });

  it('can include internal error message for development mapping only', () => {
    const problem = mapApiErrorToProblemDetails(new Error('local debug detail'), {
      includeInternalMessage: true,
    });

    expect(problem.status).toBe(500);
    expect(problem.detail).toBe('local debug detail');
  });
});
