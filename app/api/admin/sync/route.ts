import { NextRequest } from 'next/server';

import {
  AdminSyncPayloadSchema,
  assertAdminSessionAuthorization,
  createAdminSyncCommand,
  createAdminSyncSuccessEnvelope,
  runAdminSync,
} from '@/lib/server/admin/service';
import { readOptionalJsonBody } from '@/lib/server/http/read-json-body';
import { createUnauthorizedResponse, errorJson, okJson } from '@/lib/server/http/responses';
import { createServerLogger } from '@/lib/server/logging';

const logger = createServerLogger('AdminSyncApi');

export async function POST(req: NextRequest) {
  try {
    await assertAdminSessionAuthorization();
    const body = await readOptionalJsonBody(req, AdminSyncPayloadSchema, {});
    const command = createAdminSyncCommand(body);
    const results = await runAdminSync(command.mode);

    return okJson(createAdminSyncSuccessEnvelope(command, results));
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED_ADMIN_SESSION') {
      return createUnauthorizedResponse();
    }

    logger.error('Sync failed', error);
    return errorJson('Sync failed', 'SYNC_FAILED', undefined, { status: 500 });
  }
}
