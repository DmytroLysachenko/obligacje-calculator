import { pgTable, text, timestamp, uuid, numeric, integer, boolean, pgEnum, serial, date } from "drizzle-orm/pg-core";

export const instrumentTypeEnum = pgEnum("instrument_type", ["bond", "equity", "commodity", "crypto"]);
export const interestTypeEnum = pgEnum("interest_type", ["fixed", "floating_nbp", "inflation_linked"]);

export const polishBonds = pgTable("polish_bonds", {
  id: uuid("id").primaryKey().defaultRandom(),
  symbol: text("symbol").notNull().unique(),
  fullName: text("full_name").notNull(),
  durationDays: integer("duration_days").notNull(),
  nominalValue: numeric("nominal_value", { precision: 10, scale: 2 }).default("100.00"),
  capitalizationFreqDays: integer("capitalization_freq_days").default(0),
  payoutFreqDays: integer("payout_freq_days").default(0),
  interestType: interestTypeEnum("interest_type").notNull(),
  baseMargin: numeric("base_margin", { precision: 5, scale: 2 }),
  withdrawalFee: numeric("withdrawal_fee", { precision: 5, scale: 2 }),
  withdrawalFeeCap: boolean("withdrawal_fee_cap").default(true),
  rolloverDiscount: numeric("rollover_discount", { precision: 5, scale: 2 }),
  isFamilyOnly: boolean("is_family_only").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const investmentInstruments = pgTable("investment_instruments", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: instrumentTypeEnum("category").notNull(),
  ticker: text("ticker").notNull().unique(),
  displayName: text("display_name").notNull(),
  riskScore: integer("risk_score").notNull(),
  dataSource: text("data_source").notNull(),
  currency: text("currency").default("PLN"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const instrumentPriceHistory = pgTable("instrument_price_history", {
  id: serial("id").primaryKey(),
  instrumentId: uuid("instrument_id").references(() => investmentInstruments.id),
  date: date("date").notNull(),
  priceClose: numeric("price_close", { precision: 20, scale: 8 }).notNull(),
  inflationValue: numeric("inflation_value", { precision: 5, scale: 2 }),
});

export const economicIndicators = pgTable("economic_indicators", {
  id: serial("id").primaryKey(),
  indicatorName: text("indicator_name").notNull(),
  date: date("date").notNull(),
  value: numeric("value", { precision: 10, scale: 4 }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userPortfolios = pgTable("user_portfolios", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(), // Placeholder for future Auth
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userInvestmentLots = pgTable("user_investment_lots", {
  id: uuid("id").primaryKey().defaultRandom(),
  portfolioId: uuid("portfolio_id").references(() => userPortfolios.id, { onDelete: 'cascade' }),
  bondType: text("bond_type").notNull(), // Symbol like EDO, COI
  purchaseDate: date("purchase_date").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(), // Invested amount
  isRebought: boolean("is_rebought").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type NewEconomicIndicator = typeof economicIndicators.$inferInsert;
export type EconomicIndicator = typeof economicIndicators.$inferSelect;

export type NewUserPortfolio = typeof userPortfolios.$inferInsert;
export type UserPortfolio = typeof userPortfolios.$inferSelect;

export type NewUserInvestmentLot = typeof userInvestmentLots.$inferInsert;
export type UserInvestmentLot = typeof userInvestmentLots.$inferSelect;
