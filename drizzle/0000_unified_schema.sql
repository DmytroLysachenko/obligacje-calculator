CREATE TYPE "public"."instrument_type" AS ENUM('bond', 'equity', 'commodity', 'crypto');--> statement-breakpoint
CREATE TYPE "public"."interest_type" AS ENUM('fixed', 'floating_nbp', 'inflation_linked');--> statement-breakpoint
CREATE TYPE "public"."series_category" AS ENUM('macro', 'instrument', 'index', 'currency');--> statement-breakpoint
CREATE TABLE "data_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"series_id" uuid NOT NULL,
	"date" date NOT NULL,
	"value" numeric(20, 8) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "economic_indicators" (
	"id" serial PRIMARY KEY NOT NULL,
	"indicator_name" text NOT NULL,
	"date" date NOT NULL,
	"value" numeric(15, 6) NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "investment_instruments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"series_id" uuid,
	"ticker" text NOT NULL,
	"display_name" text NOT NULL,
	"risk_score" integer NOT NULL,
	"currency" text DEFAULT 'PLN',
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "investment_instruments_ticker_unique" UNIQUE("ticker")
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "user_investment_lots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portfolio_id" uuid,
	"bond_type" text NOT NULL,
	"purchase_date" date NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"is_rebought" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_portfolios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "data_points" ADD CONSTRAINT "data_points_series_id_data_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."data_series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_instruments" ADD CONSTRAINT "investment_instruments_series_id_data_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."data_series"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_investment_lots" ADD CONSTRAINT "user_investment_lots_portfolio_id_user_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."user_portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "series_date_idx" ON "data_points" USING btree ("series_id","date");