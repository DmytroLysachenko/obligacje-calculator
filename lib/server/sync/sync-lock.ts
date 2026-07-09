import { sql } from 'drizzle-orm';

import { db, isDatabaseConfigured } from '@/db';

const FULL_SYNC_LOCK_NAME = 'obligacje-calculator:full-sync';

type LockQueryResult = { locked?: boolean }[] | { rows?: { locked?: boolean }[] };

function rowsFromResult(result: LockQueryResult) {
  return Array.isArray(result) ? result : (result.rows ?? []);
}

export async function acquireFullSyncLock() {
  if (!isDatabaseConfigured) {
    return { acquired: true, release: async () => {} };
  }

  const result = (await db.execute(sql`
    SELECT pg_try_advisory_lock(hashtext(${FULL_SYNC_LOCK_NAME})) AS locked
  `)) as LockQueryResult;
  const acquired = rowsFromResult(result)[0]?.locked === true;

  return {
    acquired,
    release: async () => {
      if (!acquired) {
        return;
      }

      await db.execute(sql`
        SELECT pg_advisory_unlock(hashtext(${FULL_SYNC_LOCK_NAME}))
      `);
    },
  };
}
