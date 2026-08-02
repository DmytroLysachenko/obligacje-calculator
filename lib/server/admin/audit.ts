import { db, isDatabaseConfigured } from '@/db';
import { adminAuditEvents } from '@/db/schema';
import { createServerLogger } from '@/lib/server/logging';

const logger = createServerLogger('AdminAudit');

export type AdminAuditAction = 'sync-requested' | 'sync-failed' | 'status-read';

export async function recordAdminAuditEvent(input: {
  action: AdminAuditAction;
  actorEmail?: string;
  requestId?: string;
  detail?: string;
}) {
  if (!isDatabaseConfigured) return;
  try {
    await db.insert(adminAuditEvents).values({
      action: input.action,
      actorEmail: input.actorEmail?.toLowerCase(),
      requestId: input.requestId,
      detail: input.detail,
    });
  } catch (error) {
    logger.error('Unable to record admin audit event', error);
  }
}
