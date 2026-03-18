import postgres from 'postgres';
import 'dotenv/config';

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not defined");
    process.exit(1);
  }
  const sql = postgres(process.env.DATABASE_URL);

  console.log("[Migration] Dropping all existing tables and types for a clean start...");
  
  const tables = [
    'data_points', 'data_series', 'economic_indicators', 
    'investment_instruments', 'polish_bonds', 
    'user_investment_lots', 'user_portfolios',
    'instrument_price_history' // legacy
  ];

  for (const table of tables) {
    try {
      await sql`DROP TABLE IF EXISTS ${sql(table)} CASCADE`;
      console.log(`[Migration] Dropped table: ${table}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn(`[Migration] Error dropping ${table}: ${message}`);
    }
  }

  const types = ['instrument_type', 'interest_type', 'series_category', 'indicator_type'];
  for (const type of types) {
    try {
      await sql`DROP TYPE IF EXISTS ${sql(type)} CASCADE`;
      console.log(`[Migration] Dropped type: ${type}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn(`[Migration] Error dropping ${type}: ${message}`);
    }
  }

  console.log("[Migration] Creating new unified schema...");

  const schemaSql = `
CREATE TYPE "public"."instrument_type" AS ENUM('bond', 'equity', 'commodity', 'crypto');
CREATE TYPE "public"."interest_type" AS ENUM('fixed', 'floating_nbp', 'inflation_linked');
CREATE TYPE "public"."series_category" AS ENUM('macro', 'instrument', 'index', 'currency');

CREATE TABLE "data_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" "series_category" DEFAULT 'macro' NOT NULL,
	"unit" text NOT NULL,
	"frequency" text DEFAULT 'monthly' NOT NULL,
	"data_source" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "data_series_slug_unique" UNIQUE("slug")
);

CREATE TABLE "data_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"series_id" uuid NOT NULL,
	"date" date NOT NULL,
	"value" numeric(20, 8) NOT NULL,
	"created_at" timestamp DEFAULT now(),
    CONSTRAINT "data_points_series_id_data_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."data_series"("id") ON DELETE cascade
);

CREATE UNIQUE INDEX "series_date_idx" ON "data_points" USING btree ("series_id","date");

CREATE TABLE "investment_instruments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"series_id" uuid,
	"ticker" text NOT NULL,
	"display_name" text NOT NULL,
	"risk_score" integer NOT NULL,
	"currency" text DEFAULT 'PLN',
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "investment_instruments_ticker_unique" UNIQUE("ticker"),
    CONSTRAINT "investment_instruments_series_id_data_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."data_series"("id")
);

CREATE TABLE "polish_bonds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" text NOT NULL,
	"full_name" text NOT NULL,
	"duration_days" integer NOT NULL,
	"nominal_value" numeric(10, 2) DEFAULT '100.00',
	"capitalization_freq_days" integer DEFAULT 0,
	"payout_freq_days" integer DEFAULT 0,
	"interest_type" "interest_type" NOT NULL,
	"base_margin" numeric(5, 2),
	"withdrawal_fee" numeric(5, 2),
	"withdrawal_fee_cap" boolean DEFAULT true,
	"rollover_discount" numeric(5, 2),
	"is_family_only" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "polish_bonds_symbol_unique" UNIQUE("symbol")
);

CREATE TABLE "user_portfolios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "user_investment_lots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portfolio_id" uuid,
	"bond_type" text NOT NULL,
	"purchase_date" date NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"is_rebought" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
    CONSTRAINT "user_investment_lots_portfolio_id_user_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."user_portfolios"("id") ON DELETE cascade
);
`;

  const statements = schemaSql.split(';').filter(s => s.trim().length > 0);
  for (const statement of statements) {
    try {
      await sql.unsafe(statement);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(`[Migration] Error executing statement: ${message}\nStatement: ${statement}`);
    }
  }

  console.log("[Migration] Schema creation complete.");
  process.exit(0);
}

migrate();
