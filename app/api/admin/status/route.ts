import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '@/shared/types/api';
import {
  assertAdminSyncAuthorization,
  getAdminStatusSnapshot,
} from '@/lib/server/admin/service';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  try {
    assertAdminSyncAuthorization(authHeader);
    const statusSnapshot = await getAdminStatusSnapshot();

    return NextResponse.json(createSuccessResponse(statusSnapshot));
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED_SYNC_REQUEST') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('[AdminStatus] Failed to fetch status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
