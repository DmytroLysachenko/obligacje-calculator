const postgres = require('postgres');
require('dotenv').config();

async function seed() {
  const sql = postgres(process.env.DATABASE_URL);

  const instruments = [
    {
      ticker: "^SPX",
      displayName: "S&P 500",
      category: "equity",
      risk_score: 4,
      data_source: "Stooq",
      currency: "USD"
    },
    {
      ticker: "GOLD",
      displayName: "Gold",
      category: "commodity",
      risk_score: 3,
      data_source: "NBP/Stooq",
      currency: "USD"
    }
  ];

  console.log("[Seed] Seeding investment instruments...");

  for (const inst of instruments) {
    try {
      await sql`
        INSERT INTO investment_instruments (ticker, display_name, category, risk_score, data_source, currency, updated_at)
        VALUES (${inst.ticker}, ${inst.displayName}, ${inst.category}, ${inst.risk_score}, ${inst.data_source}, ${inst.currency}, NOW())
        ON CONFLICT (ticker) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          category = EXCLUDED.category,
          risk_score = EXCLUDED.risk_score,
          data_source = EXCLUDED.data_source,
          currency = EXCLUDED.currency,
          updated_at = NOW()
      `;
      console.log(`[Seed] Seeded/Updated: ${inst.displayName}`);
    } catch (error) {
      console.error(`[Seed] Failed to seed ${inst.displayName}:`, error);
    }
  }

  console.log("[Seed] Seeding completed.");
  process.exit(0);
}

seed();
