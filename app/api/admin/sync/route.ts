import { NextRequest } from 'next/server';

import {
  AdminSyncPayloadSchema,
  assertAdminSyncAuthorization,
  createAdminSyncCommand,
  createAdminSyncSuccessEnvelope,
  getAdminSyncEndpointInfo,
  runAdminSync,
} from '@/lib/server/admin/service';
import { readOptionalJsonBody } from '@/lib/server/http/read-json-body';
import { createUnauthorizedResponse, errorJson, okJson } from '@/lib/server/http/responses';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  try {
    assertAdminSyncAuthorization(authHeader);
    const body = await readOptionalJsonBody(req, AdminSyncPayloadSchema, {});
    const command = createAdminSyncCommand(body);
    const results = await runAdminSync(command.mode);

    return okJson(createAdminSyncSuccessEnvelope(command, results));
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED_SYNC_REQUEST') {
      return createUnauthorizedResponse();
    }

    console.error('[AdminSync] Sync failed:', error);
    return errorJson('Sync failed', 'SYNC_FAILED', String(error), { status: 500 });
  }
}

export async function GET() {
  return okJson(getAdminSyncEndpointInfo());
}
