import { db } from "@/db";
import { dataSeries, dataPoints } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NbpApiClient } from "../api-clients/nbp";
import { StooqApiClient } from "../api-clients/stooq";

/**
 * Helper to retry a function with exponential backoff.
 */
async function retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}

/**
 * Syncs macroeconomic data (Inflation, NBP Rate, WIBOR) from real sources.
 */
export async function syncMacroData() {
  const nbpClient = new NbpApiClient();
  const stooqClient = new StooqApiClient();
  
  try {
    // 1. Fetch NBP Reference Rate
    const nbpIndicators = await retry(() => nbpClient.fetchLatestData());
    const nbpRefRate = nbpIndicators.find(i => i.name === 'nbp_reference_rate');
    
    // 2. Fetch Inflation (CPI) from Stooq
    const inflationIndicators = await retry(() => stooqClient.fetchHistoricalData(
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      'cpip.pl' 
    ));
    const latestInflation = inflationIndicators.at(-1);

    // 3. Fetch WIBOR Rates (3M and 6M)
    const wibor3mIndicators = await retry(() => stooqClient.fetchHistoricalData(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      'plopln3m.m'
    ));
    const latestWibor3m = wibor3mIndicators.at(-1);

    const wibor6mIndicators = await retry(() => stooqClient.fetchHistoricalData(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      'plopln6m.m'
    ));
    const latestWibor6m = wibor6mIndicators.at(-1);

    const macroIndicators = [
      { slug: 'inflation-pl', name: 'Polish Inflation (CPI)', unit: '%', source: 'Stooq/GUS', data: latestInflation },
      { slug: 'nbp-rate', name: 'NBP Reference Rate', unit: '%', source: 'NBP', data: nbpRefRate },
      { slug: 'pl-wibor-3m', name: 'WIBOR 3M', unit: '%', source: 'Stooq', data: latestWibor3m },
      { slug: 'pl-wibor-6m', name: 'WIBOR 6M', unit: '%', source: 'Stooq', data: latestWibor6m },
    ];

    const results = {
      inflation: latestInflation?.value,
      nbp: nbpRefRate?.value,
      wibor3m: latestWibor3m?.value,
      wibor6m: latestWibor6m?.value,
    };

    for (const indicator of macroIndicators) {
      if (!indicator.data) continue;

      let series = await db.query.dataSeries.findFirst({
        where: eq(dataSeries.slug, indicator.slug)
      });
      
      if (!series) {
        [series] = await db.insert(dataSeries).values({
          name: indicator.name,
          slug: indicator.slug,
          category: 'macro',
          unit: indicator.unit,
          dataSource: indicator.source,
        }).returning();
      }

      // Update data point
      await db.insert(dataPoints)
        .values({
          seriesId: series.id,
          date: indicator.data.date,
          value: indicator.data.value.toString(),
        })
        .onConflictDoUpdate({
          target: [dataPoints.seriesId, dataPoints.date],
          set: { value: indicator.data.value.toString() }
        });

      // Update series metadata
      await db.update(dataSeries)
        .set({ 
          lastDataPointDate: indicator.data.date,
          updatedAt: new Date()
        })
        .where(eq(dataSeries.id, series.id));
    }

    return results;
  } catch (error) {
    console.error('Macro sync failed:', error);
    return null;
  }
}
