import { NextRequest } from 'next/server';
import { z } from 'zod';

import { CalculationDomainError } from '@/features/bond-core/errors';

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
