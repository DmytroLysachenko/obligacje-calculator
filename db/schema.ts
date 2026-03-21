import { pgTable, text, timestamp, uuid, numeric, integer, boolean, pgEnum, serial, date, uniqueIndex } from "drizzle-orm/pg-core";

export const instrumentTypeEnum = pgEnum("instrument_type", ["bond", "equity", "commodity", "crypto"]);
export const interestTypeEnum = pgEnum("interest_type", ["fixed", "floating_nbp", "inflation_linked"]);
export const seriesCategoryEnum = pgEnum("series_category", ["macro", "instrument", "index", "currency"]);

/**
 * Metadata for any time-series data (Inflation, NBP Rate, S&P500, etc.)
 */
export const dataSeries = pgTable("data_series", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(), // e.g. 'pl-cpi', 'nbp-ref-rate', 'sp500'
  name: text("name").notNull(),
  description: text("description"),
  category: seriesCategoryEnum("category").notNull().default("macro"),
  unit: text("unit").notNull(), // %, PLN, USD, etc.
  frequency: text("frequency").notNull().default("monthly"), // daily, monthly, quarterly, yearly
  dataSource: text("data_source"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * The actual data points for all series
 */
export const dataPoints = pgTable("data_points", {
  id: serial("id").primaryKey(),
  seriesId: uuid("series_id").references(() => dataSeries.id, { onDelete: 'cascade' }).notNull(),
  date: date("date").notNull(),
  value: numeric("value", { precision: 20, scale: 8 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    seriesDateIdx: uniqueIndex("series_date_idx").on(table.seriesId, table.date),
  };
});

export const polishBonds = pgTable("polish_bonds", {
  id: uuid("id").primaryKey().defaultRandom(),
  symbol: text("symbol").notNull().unique(),
  fullName: text("full_name").notNull(),
  durationDays: integer("duration_days").notNull(),
  nominalValue: numeric("nominal_value", { precision: 10, scale: 2 }).default("100.00"),
  capitalizationFreqDays: integer("capitalization_freq_days").default(0),
  payoutFreqDays: integer("payout_freq_days").default(0),
  interestType: interestTypeEnum("interest_type").notNull(),
  firstYearRate: numeric("first_year_rate", { precision: 5, scale: 2 }),
  baseMargin: numeric("base_margin", { precision: 5, scale: 2 }),
  withdrawalFee: numeric("withdrawal_fee", { precision: 5, scale: 2 }),
  withdrawalFeeCap: boolean("withdrawal_fee_cap").default(true),
  rolloverDiscount: numeric("rollover_discount", { precision: 5, scale: 2 }),
  isFamilyOnly: boolean("is_family_only").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const investmentInstruments = pgTable("investment_instruments", {
  id: uuid("id").primaryKey().defaultRandom(),
  seriesId: uuid("series_id").references(() => dataSeries.id),
  ticker: text("ticker").notNull().unique(),
  displayName: text("display_name").notNull(),
  riskScore: integer("risk_score").notNull(),
  currency: text("currency").default("PLN"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userPortfolios = pgTable("user_portfolios", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userInvestmentLots = pgTable("user_investment_lots", {
  id: uuid("id").primaryKey().defaultRandom(),
  portfolioId: uuid("portfolio_id").references(() => userPortfolios.id, { onDelete: 'cascade' }),
  bondType: text("bond_type").notNull(),
  purchaseDate: date("purchase_date").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  isRebought: boolean("is_rebought").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// LEGACY TABLES - To be dropped after migration
export const economicIndicators = pgTable("economic_indicators", {
  id: serial("id").primaryKey(),
  indicatorName: text("indicator_name").notNull(),
  date: date("date").notNull(),
  value: numeric("value", { precision: 15, scale: 6 }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type NewDataSeries = typeof dataSeries.$inferInsert;
export type DataSeries = typeof dataSeries.$inferSelect;

export type NewDataPoint = typeof dataPoints.$inferInsert;
export type DataPoint = typeof dataPoints.$inferSelect;

export type NewUserPortfolio = typeof userPortfolios.$inferInsert;
export type UserPortfolio = typeof userPortfolios.$inferSelect;

export type NewUserInvestmentLot = typeof userInvestmentLots.$inferInsert;
export type UserInvestmentLot = typeof userInvestmentLots.$inferSelect;
