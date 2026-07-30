import { NextRequest } from 'next/server';

import { enqueueFinancialDataSync } from '@/lib/inngest';
import { recordAdminAuditEvent } from '@/lib/server/admin/audit';
import {
  AdminSyncPayloadSchema,
  assertAdminSessionAuthorization,
  createAdminSyncCommand,
} from '@/lib/server/admin/service';
import { readOptionalJsonBody } from '@/lib/server/http/read-json-body';
import { getRequestId } from '@/lib/server/http/request-context';
import { createUnauthorizedResponse, errorJson, okJson } from '@/lib/server/http/responses';
import { createServerLogger } from '@/lib/server/logging';

const logger = createServerLogger('AdminSyncApi');

export async function POST(req: NextRequest) {
  try {
    await assertAdminSessionAuthorization();
    const body = await readOptionalJsonBody(req, AdminSyncPayloadSchema, {});
    const command = createAdminSyncCommand(body);
    const requestId = getRequestId(req);
    const event = await enqueueFinancialDataSync({
      mode: command.mode,
      requestedBy: 'admin',
      requestId,
    });
    await recordAdminAuditEvent({ action: 'sync-requested', requestId, detail: command.mode });

    return okJson(
      {
        message: 'Sync queued successfully',
        mode: command.mode,
        requestId,
        eventIds: event.ids,
      },
      { status: 202 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED_ADMIN_SESSION') {
      return createUnauthorizedResponse();
    }

    logger.error('Sync failed', error);
    await recordAdminAuditEvent({ action: 'sync-failed' });
    return errorJson('Sync failed', 'SYNC_FAILED', undefined, { status: 500 });
  }
}
