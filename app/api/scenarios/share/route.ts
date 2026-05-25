import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ensurePortfolioSchemaCompat } from '@/lib/server/db/portfolio-schema-compat';
import { createSuccessResponse } from '@/shared/types/api';
import { createSharedSingleScenario } from '@/lib/server/shared-scenarios/service';
import { apiHandler } from '@/lib/server/http/api-handler';
import { readJsonBody } from '@/lib/server/http/read-json-body';

const SharedScenarioPayloadSchema = z.object({
  inputs: z.record(z.string(), z.unknown()),
  description: z.string().optional(),
});

export const POST = apiHandler(async (req: NextRequest) => {
  await ensurePortfolioSchemaCompat();
  const body = await readJsonBody(req, SharedScenarioPayloadSchema);

  const shareSnapshot = await createSharedSingleScenario({
    inputs: body.inputs,
    description: body.description,
    origin: req.nextUrl.origin,
  });

  return NextResponse.json(createSuccessResponse(shareSnapshot));
});
