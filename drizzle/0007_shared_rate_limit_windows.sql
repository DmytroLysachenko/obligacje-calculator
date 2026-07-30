CREATE TABLE IF NOT EXISTS "rate_limit_windows" (
  "bucket_key" text PRIMARY KEY,
  "count" integer NOT NULL,
  "reset_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL DEFAULT now()
);
