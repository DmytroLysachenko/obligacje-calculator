import { desc, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { NewSyncRun, syncRuns } from '@/db/schema';

let ensureSyncRunsSchemaPromise: Promise<void> | null = null;

export async function ensureSyncRunsSchemaRepository() {
  if (!ensureSyncRunsSchemaPromise) {
    ensureSyncRunsSchemaPromise = (async () => {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "sync_runs" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "scope" text NOT NULL,
          "provider" text,
          "series_slug" text,
          "mode" text NOT NULL,
          "status" text NOT NULL,
          "range_start" date,
          "range_end" date,
          "inserted" integer DEFAULT 0 NOT NULL,
          "updated" integer DEFAULT 0 NOT NULL,
          "skipped" integer DEFAULT 0 NOT NULL,
          "latest_data_point_date" date,
          "message" text,
          "error" text,
          "started_at" timestamp DEFAULT now() NOT NULL,
          "finished_at" timestamp
        )
      `);
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS "sync_runs_scope_idx" ON "sync_runs" ("scope")`,
      );
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS "sync_runs_series_slug_idx" ON "sync_runs" ("series_slug")`,
      );
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS "sync_runs_started_at_idx" ON "sync_runs" ("started_at")`,
      );
    })();
  }

  return ensureSyncRunsSchemaPromise;
}

export async function insertSyncRun(values: NewSyncRun) {
  await ensureSyncRunsSchemaRepository();
  const [run] = await db.insert(syncRuns).values(values).returning();
  return run;
}

export async function findRecentSyncRuns(limit: number) {
  await ensureSyncRunsSchemaRepository();
  return db.query.syncRuns.findMany({
    orderBy: [desc(syncRuns.startedAt)],
    limit,
  });
}

export async function findLatestSyncRunForSeries(seriesSlug: string) {
  await ensureSyncRunsSchemaRepository();
  return db.query.syncRuns.findFirst({
    where: eq(syncRuns.seriesSlug, seriesSlug),
    orderBy: [desc(syncRuns.startedAt)],
  });
}
