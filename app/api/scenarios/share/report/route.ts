import { NextRequest } from 'next/server';

import { apiHandler } from '@/lib/server/http/api-handler';
import { shareAbuseReportRateLimitPolicy } from '@/lib/server/http/rate-limiter';
import { readJsonBody } from '@/lib/server/http/read-json-body';
import { getRequestId } from '@/lib/server/http/request-context';
import { okJson } from '@/lib/server/http/responses';
import { reportSharedScenarioAbuse } from '@/lib/server/shared-scenarios/abuse';
import { SharedScenarioAbuseReportSchema } from '@/lib/server/shared-scenarios/input-schema';

export const POST = apiHandler(
  async (req: NextRequest) => {
    const report = await readJsonBody(req, SharedScenarioAbuseReportSchema);
    reportSharedScenarioAbuse({ ...report, requestId: getRequestId(req) });

    // Acknowledging uniformly avoids turning this path into an existence oracle.
    return okJson({ accepted: true });
  },
  { rateLimitPolicy: shareAbuseReportRateLimitPolicy },
);
