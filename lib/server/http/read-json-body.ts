import { NextRequest } from 'next/server';
import { z } from 'zod';

export async function readJsonBody<TSchema extends z.ZodTypeAny>(
  req: NextRequest,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  const body = await req.json();
  return schema.parse(body);
}
