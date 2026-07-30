import {
  assertAdminSessionAuthorization,
  getAdminStatusSnapshot,
} from '@/lib/server/admin/service';
import { createUnauthorizedResponse, errorJson, okJson } from '@/lib/server/http/responses';
import { createServerLogger } from '@/lib/server/logging';

const logger = createServerLogger('AdminStatusApi');

export async function GET() {
  try {
    await assertAdminSessionAuthorization();
    const statusSnapshot = await getAdminStatusSnapshot();

    return okJson(statusSnapshot);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED_ADMIN_SESSION') {
      return createUnauthorizedResponse();
    }

    logger.error('Failed to fetch status', error);
    return errorJson('Failed to fetch status', 'ADMIN_STATUS_FAILED', undefined, { status: 500 });
  }
}
