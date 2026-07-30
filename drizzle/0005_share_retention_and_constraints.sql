-- Public calculation shares are intentionally ephemeral. Existing records get
-- a bounded transition window; new records always provide an explicit expiry.
ALTER TABLE "shared_single_scenarios"
  ADD COLUMN IF NOT EXISTS "expires_at" timestamp;

UPDATE "shared_single_scenarios"
SET "expires_at" = COALESCE("expires_at", "created_at" + interval '30 days');

ALTER TABLE "shared_single_scenarios"
  ALTER COLUMN "expires_at" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "shared_single_scenarios_expires_at_idx"
  ON "shared_single_scenarios" ("expires_at");

DO $$ BEGIN
  ALTER TABLE "user_investment_lots"
    ADD CONSTRAINT "user_investment_lots_positive_amount" CHECK ("amount" > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "shared_single_scenarios"
    ADD CONSTRAINT "shared_single_scenarios_nonempty_title" CHECK (length(trim("title")) > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
