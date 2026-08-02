import { NextRequest } from 'next/server';
import { z } from 'zod';

import { CalculationDomainError } from '@/features/bond-core/errors';

export class RequestBodyTooLargeError extends Error {
  constructor(public readonly maxBytes: number) {
    super('Request body exceeds the configured limit.');
  }
}

export async function readBoundedJsonBody<TSchema extends z.ZodTypeAny>(
  req: NextRequest,
  schema: TSchema,
  maxBytes: number,
): Promise<z.infer<TSchema>> {
  const declaredLength = Number(req.headers.get('content-length') ?? 0);
  if (!Number.isFinite(declaredLength) || declaredLength > maxBytes) {
    throw new RequestBodyTooLargeError(maxBytes);
  }

  const text = await req.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new RequestBodyTooLargeError(maxBytes);
  }

  return schema.parse(JSON.parse(text));
}

export async function readJsonBody<TSchema extends z.ZodTypeAny>(
  req: NextRequest,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw error;
    }

    throw new CalculationDomainError({
      code: 'CALCULATION_INVALID_INPUT',
      message: 'Request body could not be read safely.',
      cause: error,
    });
  }
}

export async function readOptionalJsonBody<TSchema extends z.ZodTypeAny>(
  req: NextRequest,
  schema: TSchema,
  fallback: z.infer<TSchema>,
): Promise<z.infer<TSchema>> {
  try {
    return await readJsonBody(req, schema);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return fallback;
    }

    throw error;
  }
}
