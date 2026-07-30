-- Schema changes previously performed by request-time compatibility code.
-- Migrations are the sole authority for persistent database shape.
ALTER TABLE "user_portfolios"
  ADD COLUMN IF NOT EXISTS "share_id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "user_portfolios"
  ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT false;

UPDATE "user_portfolios" SET "share_id" = gen_random_uuid() WHERE "share_id" IS NULL;
UPDATE "user_portfolios" SET "is_public" = false WHERE "is_public" IS NULL;

ALTER TABLE "user_portfolios" ALTER COLUMN "share_id" SET NOT NULL;
ALTER TABLE "user_portfolios" ALTER COLUMN "is_public" SET DEFAULT false;
ALTER TABLE "user_portfolios" ALTER COLUMN "is_public" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "user_portfolios_share_id_idx"
  ON "user_portfolios" ("share_id");

CREATE TABLE IF NOT EXISTS "shared_single_scenarios" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "share_id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "title" text NOT NULL,
  "description" text,
  "scenario_kind" text NOT NULL DEFAULT 'single-bond',
  "payload_json" text NOT NULL,
  "calculation_version" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "shared_single_scenarios_share_id_idx"
  ON "shared_single_scenarios" ("share_id");
