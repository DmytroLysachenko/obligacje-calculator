import { NextRequest } from 'next/server';
import { z } from 'zod';

import { ensurePortfolioSchemaCompat } from '@/lib/server/db/portfolio-schema-compat';
import { apiHandler } from '@/lib/server/http/api-handler';
import { readJsonBody } from '@/lib/server/http/read-json-body';
import { okJson } from '@/lib/server/http/responses';
import { createSharedSingleScenario } from '@/lib/server/shared-scenarios/service';

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

  return okJson(shareSnapshot);
});
