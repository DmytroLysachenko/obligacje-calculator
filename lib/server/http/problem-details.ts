import { z } from 'zod';
import {
  getPublicCalculationErrorMessage,
  isCalculationDomainError,
} from '@/features/bond-core/errors';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  errors?: unknown;
  code?: string;
}

export function isJsonSyntaxError(error: unknown) {
  return error instanceof SyntaxError && /json/i.test(error.message);
}

export function createProblemDetails(
  problem: Omit<ProblemDetails, 'type'> & { type?: string },
): ProblemDetails {
  return {
    type:
      problem.type ??
      `https://api.obligacje.pl/errors/${problem.title.toLowerCase().replaceAll(' ', '-')}`,
    title: problem.title,
    status: problem.status,
    detail: problem.detail,
    errors: problem.errors,
    code: problem.code,
  };
}

export function mapApiErrorToProblemDetails(
  error: unknown,
  options: {
    includeInternalMessage?: boolean;
  } = {},
): ProblemDetails {
  if (error instanceof z.ZodError) {
    return createProblemDetails({
      type: 'https://api.obligacje.pl/errors/validation-failed',
      title: 'Bad Request',
      status: 400,
      detail: 'The request payload is invalid.',
      errors: error.issues,
      code: 'VALIDATION_ERROR',
    });
  }

  if (isJsonSyntaxError(error)) {
    return createProblemDetails({
      type: 'https://api.obligacje.pl/errors/malformed-json',
      title: 'Bad Request',
      status: 400,
      detail: 'The request body must be valid JSON.',
      code: 'MALFORMED_JSON',
    });
  }

  if (isCalculationDomainError(error)) {
    return createProblemDetails({
      type: 'https://api.obligacje.pl/errors/calculation-failed',
      title: 'Calculation Failed',
      status: 422,
      detail: getPublicCalculationErrorMessage(error),
      code: error.code,
      errors: error.details,
    });
  }

  return createProblemDetails({
    type: 'https://api.obligacje.pl/errors/internal-server-error',
    title: 'Internal Server Error',
    status: 500,
    detail:
      options.includeInternalMessage && error instanceof Error
        ? error.message
        : 'An unexpected internal error occurred. Please try again later.',
    code: 'INTERNAL_SERVER_ERROR',
  });
}
