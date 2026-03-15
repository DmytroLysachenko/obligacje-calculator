import { pgTable, serial, text, doublePrecision, date, timestamp, uniqueIndex, jsonb } from "drizzle-orm/pg-core";

export const economicIndicators = pgTable("economic_indicators", {
  id: serial("id").primaryKey(),
  indicatorName: text("indicator_name").notNull(), // e.g. 'nbp_rate', 'gold_price', 'sp500', 'inflation_pl'
  value: doublePrecision("value").notNull(),
  date: date("date").notNull(), // The date this value refers to
  metadata: jsonb("metadata"), // For any additional data from source API
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    indicatorDateIdx: uniqueIndex("indicator_date_idx").on(table.indicatorName, table.date),
  };
});

export type EconomicIndicator = typeof economicIndicators.$inferSelect;
export type NewEconomicIndicator = typeof economicIndicators.$inferInsert;
