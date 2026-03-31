import { db } from "@/db";
import { dataSeries, dataPoints, investmentInstruments } from "@/db/schema";
import { StooqApiClient } from "@/lib/api-clients/stooq";
import { eq } from "drizzle-orm";
import "dotenv/config";

interface NbpRateItem {
  obowiazuje_od: string;
  oprocentowanie: string;
}

async function seedMacroAndMarket() {
  const stooq = new StooqApiClient();

  const seriesMetadata = [
    {
      slug: 'pl-cpi',
      name: 'Poland Inflation (CPI)',
      category: 'macro' as const,
      unit: '%',
      frequency: 'monthly',
      dataSource: 'GUS'
    },
    {
      slug: 'nbp-ref-rate',
      name: 'NBP Reference Rate',
      category: 'macro' as const,
      unit: '%',
      frequency: 'irregular',
      dataSource: 'NBP'
    },
    {
      slug: 'sp500',
      name: 'S&P 500 Index',
      category: 'index' as const,
      unit: 'USD',
      frequency: 'monthly',
      dataSource: 'Stooq'
    },
    {
      slug: 'gold-usd',
      name: 'Gold Price (USD)',
      category: 'instrument' as const,
      unit: 'USD',
      frequency: 'daily',
      dataSource: 'NBP/Stooq'
    }
  ];

  console.log("[Seed] Seeding metadata series...");

  for (const s of seriesMetadata) {
    await db.insert(dataSeries).values({
      ...s,
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: dataSeries.slug,
      set: { ...s, updatedAt: new Date() }
    });
  }

  // 1. Fetch and seed NBP Rate
  console.log("[Seed] Fetching NBP Reference Rate...");
  try {
    const rateSeries = await db.query.dataSeries.findFirst({ where: eq(dataSeries.slug, 'nbp-ref-rate') });
    if (rateSeries) {
      const response = await fetch("https://api.nbp.pl/api/statystyka/stopy/ref?format=json");
      if (response.ok) {
        const data = await response.json() as NbpRateItem[];
        const points = data.map((item) => ({
          seriesId: rateSeries.id,
          date: item.obowiazuje_od,
          value: parseFloat(item.oprocentowanie.replace(',', '.')).toString()
        }));
        
        await db.insert(dataPoints).values(points).onConflictDoNothing();
        console.log(`[Seed] Seeded ${points.length} NBP rate points.`);
      }
    }
  } catch (e) {
    console.error("[Seed] Failed to fetch NBP rates:", e);
  }

  // 2. Fetch and seed S&P 500 (Stooq)
  console.log("[Seed] Fetching S&P 500 data...");
  try {
    const spxSeries = await db.query.dataSeries.findFirst({ where: eq(dataSeries.slug, 'sp500') });
    if (spxSeries) {
      const spxData = await stooq.fetchHistoricalData('2000-01-01', '^SPX');
      const points = spxData.map(d => ({
        seriesId: spxSeries.id,
        date: d.date,
        value: d.value.toString()
      }));
      
      for (let i = 0; i < points.length; i += 100) {
        await db.insert(dataPoints).values(points.slice(i, i + 100)).onConflictDoNothing();
      }
      console.log(`[Seed] Seeded ${points.length} S&P 500 points.`);

      await db.insert(investmentInstruments).values({
        seriesId: spxSeries.id,
        ticker: '^SPX',
        displayName: 'S&P 500 Index',
        riskScore: 4,
        currency: 'USD',
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: investmentInstruments.ticker,
        set: { seriesId: spxSeries.id, updatedAt: new Date() }
      });
    }
  } catch (e) {
    console.error("[Seed] Failed to fetch S&P 500 data:", e);
  }

  // 3. Mock Inflation (until we have a better GUS scraper or API)
  console.log("[Seed] Seeding placeholder historical inflation...");
  const cpiSeries = await db.query.dataSeries.findFirst({ where: eq(dataSeries.slug, 'pl-cpi') });
  if (cpiSeries) {
    const inflationPoints = [
      { date: '2023-01-01', value: '17.2' },
      { date: '2023-02-01', value: '18.4' },
      { date: '2023-03-01', value: '16.1' },
      { date: '2023-04-01', value: '14.7' },
      { date: '2023-05-01', value: '13.0' },
      { date: '2023-06-01', value: '11.5' },
      { date: '2023-07-01', value: '10.8' },
      { date: '2023-08-01', value: '10.1' },
      { date: '2023-09-01', value: '8.2' },
      { date: '2023-10-01', value: '6.6' },
      { date: '2023-11-01', value: '6.6' },
      { date: '2023-12-01', value: '6.2' },
      { date: '2024-01-01', value: '3.7' },
      { date: '2024-02-01', value: '2.8' },
      { date: '2024-03-01', value: '2.0' },
      { date: '2024-04-01', value: '2.4' },
      { date: '2024-05-01', value: '2.5' },
    ];
    
    await db.insert(dataPoints).values(
      inflationPoints.map(p => ({ seriesId: cpiSeries.id, ...p }))
    ).onConflictDoNothing();
    console.log("[Seed] Seeded historical inflation points.");
  }

  console.log("[Seed] Data seeding completed.");
}

seedMacroAndMarket().then(() => process.exit(0));
