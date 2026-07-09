ALTER TABLE "user_investment_lots"
ALTER COLUMN "portfolio_id" SET NOT NULL;

DROP INDEX IF EXISTS "lot_purchase_date_idx";
DROP INDEX IF EXISTS "lot_portfolio_idx";

CREATE INDEX IF NOT EXISTS "lot_portfolio_idx"
ON "user_investment_lots" ("portfolio_id");

CREATE INDEX IF NOT EXISTS "lot_portfolio_purchase_date_idx"
ON "user_investment_lots" ("portfolio_id", "purchase_date");
