import {NextResponse} from 'next/server';
import {createErrorResponse} from '@/shared/types/api';

export function createUnauthorizedResponse() {
  return NextResponse.json({error: 'Unauthorized'}, {status: 401});
}

export function createValidationErrorResponse(
  message: string,
  code = 'VALIDATION_ERROR',
  details?: unknown,
) {
  return NextResponse.json(createErrorResponse(message, code, details), {status: 400});
}

export function createDomainErrorResponse(error: {
  message: string;
  code: string;
  status: number;
  details?: unknown;
}) {
  return NextResponse.json(
    createErrorResponse(error.message, error.code, error.details),
    {status: error.status},
  );
}
