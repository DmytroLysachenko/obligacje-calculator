import postgres from 'postgres';
import 'dotenv/config';

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not defined");
    process.exit(1);
  }
  const sql = postgres(process.env.DATABASE_URL);

  const series = [
    {
      slug: 'pl-cpi',
      name: 'Poland Inflation (CPI)',
      description: 'Consumer Price Index year-over-year change in Poland.',
      category: 'macro',
      unit: '%',
      frequency: 'monthly',
      data_source: 'GUS/WorldBank'
    },
    {
      slug: 'nbp-ref-rate',
      name: 'NBP Reference Rate',
      description: 'The main interest rate of the National Bank of Poland.',
      category: 'macro',
      unit: '%',
      frequency: 'irregular',
      data_source: 'NBP'
    },
    {
      slug: 'sp500',
      name: 'S&P 500 Index',
      description: 'Standard & Poor\'s 500 stock market index.',
      category: 'index',
      unit: 'USD',
      frequency: 'monthly',
      data_source: 'Stooq'
    },
    {
      slug: 'gold-usd',
      name: 'Gold Price (USD)',
      description: 'Spot price of gold in US Dollars.',
      category: 'instrument',
      unit: 'USD',
      frequency: 'daily',
      data_source: 'NBP/Stooq'
    },
    {
      slug: 'pl-unemployment',
      name: 'Poland Unemployment Rate',
      description: 'Registered unemployment rate in Poland.',
      category: 'macro',
      unit: '%',
      frequency: 'monthly',
      data_source: 'GUS'
    }
  ];

  console.log("[Seed] Seeding data series metadata...");

  for (const s of series) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [inserted] = await sql`
        INSERT INTO data_series (slug, name, description, category, unit, frequency, data_source, updated_at)
        VALUES (${s.slug}, ${s.name}, ${s.description}, ${s.category}, ${s.unit}, ${s.frequency}, ${s.data_source}, NOW())
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          unit = EXCLUDED.unit,
          frequency = EXCLUDED.frequency,
          data_source = EXCLUDED.data_source,
          updated_at = NOW()
        RETURNING id
      `;
      console.log(`[Seed] Seeded series: ${s.name} (${s.slug})`);

      // If it's an instrument, also seed investment_instruments table
      if (s.slug === 'sp500' || s.slug === 'gold-usd') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const ticker = s.slug === 'sp500' ? '^SPX' : 'GOLD';
        await sql`
          INSERT INTO investment_instruments (series_id, ticker, display_name, risk_score, currency, updated_at)
          VALUES (\${inserted.id}, \${ticker}, \${s.name}, \${s.slug === 'sp500' ? 4 : 3}, \${s.unit}, NOW())
          ON CONFLICT (ticker) DO UPDATE SET
            series_id = EXCLUDED.series_id,
            display_name = EXCLUDED.display_name,
            updated_at = NOW()
        `;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Seed] Failed to seed ${s.slug}:`, message);
    }
  }

  console.log("[Seed] Series metadata seeding completed.");
  process.exit(0);
}

seed();
