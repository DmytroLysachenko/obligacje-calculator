import { NextRequest } from 'next/server';

import { apiHandler } from '@/lib/server/http/api-handler';
import { shareCreationRateLimitPolicy } from '@/lib/server/http/rate-limiter';
import { readJsonBody } from '@/lib/server/http/read-json-body';
import { okJson } from '@/lib/server/http/responses';
import { SharedScenarioPayloadSchema } from '@/lib/server/shared-scenarios/input-schema';
import { createSharedSingleScenario } from '@/lib/server/shared-scenarios/service';

export const POST = apiHandler(
  async (req: NextRequest) => {
    const body = await readJsonBody(req, SharedScenarioPayloadSchema);

    const shareSnapshot = await createSharedSingleScenario({
      inputs: body.inputs,
      description: body.description,
    });

    return okJson(shareSnapshot);
  },
  { rateLimitPolicy: shareCreationRateLimitPolicy },
);
