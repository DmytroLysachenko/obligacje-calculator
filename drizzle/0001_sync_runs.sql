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
);

CREATE INDEX IF NOT EXISTS "sync_runs_scope_idx" ON "sync_runs" ("scope");
CREATE INDEX IF NOT EXISTS "sync_runs_series_slug_idx" ON "sync_runs" ("series_slug");
CREATE INDEX IF NOT EXISTS "sync_runs_started_at_idx" ON "sync_runs" ("started_at");
