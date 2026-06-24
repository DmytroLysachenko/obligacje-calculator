import { NextRequest } from 'next/server';
import { assertAdminSyncAuthorization, getAdminStatusSnapshot } from '@/lib/server/admin/service';
import { createUnauthorizedResponse, errorJson, okJson } from '@/lib/server/http/responses';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  try {
    assertAdminSyncAuthorization(authHeader);
    const statusSnapshot = await getAdminStatusSnapshot();

    return okJson(statusSnapshot);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED_SYNC_REQUEST') {
      return createUnauthorizedResponse();
    }

    console.error('[AdminStatus] Failed to fetch status:', error);
    return errorJson('Failed to fetch status', 'ADMIN_STATUS_FAILED', undefined, { status: 500 });
  }
}
