import { NextRequest } from 'next/server';
import {
  assertAdminSyncAuthorization,
  runAdminSync,
  type SyncMode,
} from '@/lib/server/admin/service';
import { createUnauthorizedResponse, errorJson, okJson } from '@/lib/server/http/responses';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  try {
    assertAdminSyncAuthorization(authHeader);
    const body = (await req.json().catch(() => ({}))) as { mode?: SyncMode };
    const mode = body.mode ?? 'full-sync';
    const results = await runAdminSync(mode);

    return okJson({
      message: 'Sync completed successfully',
      timestamp: new Date().toISOString(),
      mode,
      results,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED_SYNC_REQUEST') {
      return createUnauthorizedResponse();
    }

    console.error('[AdminSync] Sync failed:', error);
    return errorJson('Sync failed', 'SYNC_FAILED', String(error), { status: 500 });
  }
}

export async function GET() {
  return okJson({
    status: 'Sync endpoint ready',
    instructions: 'POST to this endpoint to trigger a full financial data sync.',
    modes: ['full-sync', 'metadata-seed', 'market-history-seed', 'market-history-sync'],
  });
}
