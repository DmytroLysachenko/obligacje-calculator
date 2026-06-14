import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { NewSyncRun, syncRuns } from '@/db/schema';

export type SyncRunStatus = 'success' | 'partial' | 'failed' | 'up-to-date' | 'no-new-data';

export interface RecordSyncRunInput {
  scope: string;
  provider?: string | null;
  seriesSlug?: string | null;
  mode: string;
  status: SyncRunStatus | string;
  rangeStart?: string | null;
  rangeEnd?: string | null;
  inserted?: number;
  updated?: number;
  skipped?: number;
  latestDataPointDate?: string | null;
  message?: string | null;
  error?: string | null;
  startedAt?: Date;
  finishedAt?: Date;
}

function isMissingSyncRunsTableError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const maybeDbError = error as Error & {
    code?: string;
    cause?: {
      code?: string;
      message?: string;
    };
  };

  return (
    maybeDbError.code === '42P01' ||
    maybeDbError.cause?.code === '42P01' ||
    error.message.includes('relation "sync_runs" does not exist')
  );
}

let ensureSyncRunsSchemaPromise: Promise<void> | null = null;

export async function ensureSyncRunsSchema() {
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
      await db.execute(sql`CREATE INDEX IF NOT EXISTS "sync_runs_scope_idx" ON "sync_runs" ("scope")`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS "sync_runs_series_slug_idx" ON "sync_runs" ("series_slug")`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS "sync_runs_started_at_idx" ON "sync_runs" ("started_at")`);
    })();
  }

  return ensureSyncRunsSchemaPromise;
}

export async function recordSyncRun(input: RecordSyncRunInput) {
  try {
    await ensureSyncRunsSchema();
    const [run] = await db
      .insert(syncRuns)
      .values({
        scope: input.scope,
        provider: input.provider ?? null,
        seriesSlug: input.seriesSlug ?? null,
        mode: input.mode,
        status: input.status,
        rangeStart: input.rangeStart ?? null,
        rangeEnd: input.rangeEnd ?? null,
        inserted: input.inserted ?? 0,
        updated: input.updated ?? 0,
        skipped: input.skipped ?? 0,
        latestDataPointDate: input.latestDataPointDate ?? null,
        message: input.message ?? null,
        error: input.error ?? null,
        startedAt: input.startedAt ?? new Date(),
        finishedAt: input.finishedAt ?? new Date(),
      } satisfies NewSyncRun)
      .returning();

    return run;
  } catch (error) {
    if (isMissingSyncRunsTableError(error)) {
      return null;
    }

    throw error;
  }
}

export async function listRecentSyncRuns(limit = 25) {
  try {
    await ensureSyncRunsSchema();
    return await db.query.syncRuns.findMany({
      orderBy: [desc(syncRuns.startedAt)],
      limit,
    });
  } catch (error) {
    if (isMissingSyncRunsTableError(error)) {
      return [];
    }

    throw error;
  }
}

export async function getLatestSyncRunForSeries(seriesSlug: string) {
  try {
    await ensureSyncRunsSchema();
    return await db.query.syncRuns.findFirst({
      where: eq(syncRuns.seriesSlug, seriesSlug),
      orderBy: [desc(syncRuns.startedAt)],
    });
  } catch (error) {
    if (isMissingSyncRunsTableError(error)) {
      return null;
    }

    throw error;
  }
}
