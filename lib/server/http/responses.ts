import { NextResponse } from 'next/server';
import { createErrorResponse, createSuccessResponse } from '@/shared/types/api';

export function rawJson<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function okJson<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(createSuccessResponse(data), init);
}

export function createdJson<T>(data: T, init: ResponseInit = {}) {
  return okJson(data, {
    ...init,
    status: init.status ?? 201,
  });
}

export function errorJson(
  message: string,
  code?: string,
  details?: unknown,
  init: ResponseInit = {},
) {
  return NextResponse.json(createErrorResponse(message, code, details), init);
}

export function createUnauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function createValidationErrorResponse(
  message: string,
  code = 'VALIDATION_ERROR',
  details?: unknown,
) {
  return errorJson(message, code, details, { status: 400 });
}

export function createDomainErrorResponse(error: {
  message: string;
  code: string;
  status: number;
  details?: unknown;
}) {
  return errorJson(error.message, error.code, error.details, { status: error.status });
}
