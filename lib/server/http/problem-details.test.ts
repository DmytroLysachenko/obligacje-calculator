import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { CalculationDomainError } from '@/features/bond-core/errors';

import {
  createProblemDetails,
  isJsonSyntaxError,
  mapApiErrorToProblemDetails,
} from './problem-details';
import {
  EmptyJsonBodyError,
  InvalidContentLengthError,
  InvalidJsonEncodingError,
  RequestBodyTooLargeError,
  UnsupportedJsonMediaTypeError,
} from './read-json-body';

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

  it('maps oversized input to a stable non-sensitive 413 response', () => {
    expect(mapApiErrorToProblemDetails(new RequestBodyTooLargeError(65_536))).toEqual({
      type: 'https://api.obligacje.pl/errors/payload-too-large',
      title: 'Payload Too Large',
      status: 413,
      detail: "The request body exceeds this endpoint's size limit.",
      code: 'PAYLOAD_TOO_LARGE',
      errors: undefined,
    });
  });

  it('does not disclose numeric body limit in oversized input response', () => {
    const problem = mapApiErrorToProblemDetails(new RequestBodyTooLargeError(37));

    expect(problem.detail).not.toContain('37');
    expect(JSON.stringify(problem)).not.toContain('37');
  });

  it('maps unsupported media type without reflecting supplied header', () => {
    const problem = mapApiErrorToProblemDetails(
      new UnsupportedJsonMediaTypeError('text/plain; secret=value'),
    );

    expect(problem).toEqual({
      type: 'https://api.obligacje.pl/errors/unsupported-media-type',
      title: 'Unsupported Media Type',
      status: 415,
      detail: 'The request body must use application/json.',
      code: 'UNSUPPORTED_MEDIA_TYPE',
      errors: undefined,
    });
    expect(JSON.stringify(problem)).not.toContain('secret');
  });

  it.each([
    new EmptyJsonBodyError(),
    new InvalidContentLengthError(),
    new InvalidJsonEncodingError(),
  ])('maps invalid body transport %s to one safe 400 contract', (error) => {
    expect(mapApiErrorToProblemDetails(error)).toEqual({
      type: 'https://api.obligacje.pl/errors/invalid-request-body',
      title: 'Bad Request',
      status: 400,
      detail: 'The request body is invalid.',
      code: 'INVALID_REQUEST_BODY',
      errors: undefined,
    });
  });

  it('keeps validation errors more specific than generic command-body failure', () => {
    const schema = z.object({ command: z.literal('sync') });
    const parsed = schema.safeParse({ command: 'delete' });

    if (parsed.success) throw new Error('Expected validation failure.');

    expect(mapApiErrorToProblemDetails(parsed.error)).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      errors: parsed.error.issues,
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
