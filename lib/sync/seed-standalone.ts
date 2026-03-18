import postgres from 'postgres';
import 'dotenv/config';

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not defined");
    process.exit(1);
  }
  const sql = postgres(process.env.DATABASE_URL);

  const instruments = [
    {
      ticker: "^SPX",
      displayName: "S&P 500",
      risk_score: 4,
      currency: "USD"
    },
    {
      ticker: "GOLD",
      displayName: "Gold",
      risk_score: 3,
      currency: "USD"
    }
  ];

  console.log("[Seed] Seeding investment instruments (standalone)...");

  for (const inst of instruments) {
    try {
      await sql`
        INSERT INTO investment_instruments (ticker, display_name, risk_score, currency, updated_at)
        VALUES (\${inst.ticker}, \${inst.displayName}, \${inst.risk_score}, \${inst.currency}, NOW())
        ON CONFLICT (ticker) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          risk_score = EXCLUDED.risk_score,
          currency = EXCLUDED.currency,
          updated_at = NOW()
      `;
      console.log(`[Seed] Seeded/Updated: \${inst.displayName}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Seed] Failed to seed ${inst.displayName}:`, message);
    }
  }

  console.log("[Seed] Seeding completed.");
  process.exit(0);
}

seed();
