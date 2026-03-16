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
