import { sql } from 'drizzle-orm';

import { db } from '@/db';

import type { SharedRateLimitStore } from './rate-limiter';

export const postgresRateLimitStore: SharedRateLimitStore = {
  async consume({ bucketKey, now, resetAt }) {
    const result = await db.execute<{ count: number; reset_at: Date }>(sql`
      insert into rate_limit_windows (bucket_key, count, reset_at, updated_at)
      values (${bucketKey}, 1, ${resetAt}, ${now})
      on conflict (bucket_key) do update set
        count = case when rate_limit_windows.reset_at <= ${now} then 1 else rate_limit_windows.count + 1 end,
        reset_at = case when rate_limit_windows.reset_at <= ${now} then ${resetAt} else rate_limit_windows.reset_at end,
        updated_at = ${now}
      returning count, reset_at
    `);
    const row = result.rows[0];
    if (!row) throw new Error('RATE_LIMIT_COUNTER_MISSING');
    return { count: Number(row.count), resetAt: new Date(row.reset_at) };
  },
};
