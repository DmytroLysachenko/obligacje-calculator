CREATE TABLE IF NOT EXISTS "web_vital_aggregates" (
  "metric" text NOT NULL,
  "path" text NOT NULL,
  "rating" text NOT NULL,
  "time_bucket" timestamp NOT NULL,
  "sample_count" integer NOT NULL DEFAULT 0,
  "value_sum" numeric(20, 4) NOT NULL DEFAULT 0,
  "value_min" numeric(20, 4) NOT NULL,
  "value_max" numeric(20, 4) NOT NULL,
  "updated_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("metric", "path", "rating", "time_bucket"),
  CONSTRAINT "web_vital_aggregates_metric_check"
    CHECK ("metric" IN ('CLS', 'INP', 'LCP')),
  CONSTRAINT "web_vital_aggregates_rating_check"
    CHECK ("rating" IN ('good', 'needs-improvement', 'poor')),
  CONSTRAINT "web_vital_aggregates_path_check"
    CHECK ("path" ~ '^/[A-Za-z0-9/_-]{0,160}$'),
  CONSTRAINT "web_vital_aggregates_sample_count_check"
    CHECK ("sample_count" > 0)
);

CREATE INDEX IF NOT EXISTS "web_vital_aggregates_time_bucket_idx"
  ON "web_vital_aggregates" ("time_bucket");
