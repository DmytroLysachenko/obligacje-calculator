import { db } from "@/db";
import { dataSeries, dataPoints } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Syncs macroeconomic data (Inflation, NBP Rate)
 */
export async function syncMacroData() {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  try {
    // 1. Fetch NBP Reference Rate
    // API: https://api.nbp.pl/api/exchangerates/tables/A?format=json (Exchange rates)
    // Rate API: https://api.nbp.pl/api/cenyzlota/last/1?format=json (Example)
    // Real NBP Rate: http://api.nbp.pl/api/statystyka/stopy/ (This is more complex, usually easier to get last 1)
    
    // const nbpResponse = await fetch('http://api.nbp.pl/api/statystyka/stopy/');
    // Note: NBP API returns XML for stopy by default. We'll use a simpler source or mock for now
    // as XML parsing in Node is a bit heavy.
    const currentNbpRate = 5.75; // Currently 5.75% in Poland

    // 2. Fetch Inflation (GUS)
    // For MVP, we can use a reliable proxy or a simpler GUS endpoint
    const currentInflation = 2.0; // Currently approx 2.0%

    // 3. Update Database
    // Ensure Series exist
    let inflationSeries = await db.query.dataSeries.findFirst({
      where: eq(dataSeries.slug, 'inflation-pl')
    });
    
    if (!inflationSeries) {
      [inflationSeries] = await db.insert(dataSeries).values({
        name: 'Polish Inflation (CPI)',
        slug: 'inflation-pl',
        category: 'macro',
        unit: '%',
        dataSource: 'GUS',
      }).returning();
    }

    let nbpSeries = await db.query.dataSeries.findFirst({
      where: eq(dataSeries.slug, 'nbp-rate')
    });
    
    if (!nbpSeries) {
      [nbpSeries] = await db.insert(dataSeries).values({
        name: 'NBP Reference Rate',
        slug: 'nbp-rate',
        category: 'macro',
        unit: '%',
        dataSource: 'NBP',
      }).returning();
    }

    // Insert data points for current month
    await db.insert(dataPoints).values([
      {
        seriesId: inflationSeries.id,
        date: `${yearMonth}-01`,
        value: currentInflation.toString(),
      },
      {
        seriesId: nbpSeries.id,
        date: `${yearMonth}-01`,
        value: currentNbpRate.toString(),
      }
    ]).onConflictDoUpdate({
      target: [dataPoints.seriesId, dataPoints.date],
      set: { value: currentInflation.toString() } // simplified
    });

    return { inflation: currentInflation, nbp: currentNbpRate };
  } catch (error) {
    console.error('Macro sync failed:', error);
    return null;
  }
}
