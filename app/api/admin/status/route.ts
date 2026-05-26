import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '@/shared/types/api';
import {
  assertAdminSyncAuthorization,
  getAdminStatusSnapshot,
} from '@/lib/server/admin/service';
import { createUnauthorizedResponse } from '@/lib/server/http/responses';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  try {
    assertAdminSyncAuthorization(authHeader);
    const statusSnapshot = await getAdminStatusSnapshot();

    return NextResponse.json(createSuccessResponse(statusSnapshot));
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED_SYNC_REQUEST') {
      return createUnauthorizedResponse();
    }

    console.error('[AdminStatus] Failed to fetch status:', error);
    return NextResponse.json({ error: 'Failed to fetch status', code: 'ADMIN_STATUS_FAILED' }, { status: 500 });
  }
}
