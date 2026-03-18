import * as dotenv from "dotenv";
dotenv.config();

async function seed() {
  const { db } = await import("@/db");
  const { investmentInstruments } = await import("@/db/schema");

  const instruments = [
    {
      ticker: "^SPX",
      displayName: "S&P 500",
      category: "equity" as const,
      riskScore: 4,
      dataSource: "Stooq",
      currency: "USD"
    },
    {
      ticker: "GOLD",
      displayName: "Gold",
      category: "commodity" as const,
      riskScore: 3,
      dataSource: "NBP/Stooq",
      currency: "USD"
    }
  ];

  console.log("[Seed] Seeding investment instruments...");

  for (const inst of instruments) {
    try {
      await db.insert(investmentInstruments).values({
        ticker: inst.ticker,
        displayName: inst.displayName,
        riskScore: inst.riskScore,
        currency: inst.currency,
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: investmentInstruments.ticker,
        set: {
          displayName: inst.displayName,
          riskScore: inst.riskScore,
          currency: inst.currency,
          updatedAt: new Date()
        }
      });
      console.log(`[Seed] Seeded/Updated: ${inst.displayName}`);
    } catch (error) {
      console.error(`[Seed] Failed to seed ${inst.displayName}:`, error);
    }
  }

  console.log("[Seed] Seeding completed.");
}

seed();
