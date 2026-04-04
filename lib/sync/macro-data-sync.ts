import { db } from "@/db";
import { dataSeries, dataPoints } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NbpApiClient } from "../api-clients/nbp";
import { StooqApiClient } from "../api-clients/stooq";

/**
 * Syncs macroeconomic data (Inflation, NBP Rate) from real sources.
 */
export async function syncMacroData() {
  const nbpClient = new NbpApiClient();
  const stooqClient = new StooqApiClient();
  
  try {
    // 1. Fetch NBP Reference Rate
    const nbpIndicators = await nbpClient.fetchLatestData();
    const nbpRefRate = nbpIndicators.find(i => i.name === 'nbp_reference_rate');
    
    // 2. Fetch Inflation (CPI) from Stooq (using PL-CPI proxy symbol if available, otherwise fallback)
    // Common Stooq symbols: 'cpip' for Poland CPI
    const inflationIndicators = await stooqClient.fetchHistoricalData(
      new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      'cpip.pl' 
    );
    const latestInflation = inflationIndicators.at(-1);

    // 3. Ensure Series exist and Update Points
    let inflationSeries = await db.query.dataSeries.findFirst({
      where: eq(dataSeries.slug, 'inflation-pl')
    });
    
    if (!inflationSeries) {
      [inflationSeries] = await db.insert(dataSeries).values({
        name: 'Polish Inflation (CPI)',
        slug: 'inflation-pl',
        category: 'macro',
        unit: '%',
        dataSource: 'Stooq/GUS',
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

    const updates = [];

    if (latestInflation) {
      updates.push({
        seriesId: inflationSeries.id,
        date: latestInflation.date,
        value: latestInflation.value.toString(),
      });
      // Update series metadata
      await db.update(dataSeries)
        .set({ 
          lastDataPointDate: latestInflation.date,
          updatedAt: new Date()
        })
        .where(eq(dataSeries.id, inflationSeries.id));
    }

    if (nbpRefRate) {
      updates.push({
        seriesId: nbpSeries.id,
        date: nbpRefRate.date,
        value: nbpRefRate.value.toString(),
      });
      // Update series metadata
      await db.update(dataSeries)
        .set({ 
          lastDataPointDate: nbpRefRate.date,
          updatedAt: new Date()
        })
        .where(eq(dataSeries.id, nbpSeries.id));
    }

    if (updates.length > 0) {
      for (const update of updates) {
        await db.insert(dataPoints)
          .values(update)
          .onConflictDoUpdate({
            target: [dataPoints.seriesId, dataPoints.date],
            set: { value: update.value }
          });
      }
    }

    return { 
      inflation: latestInflation?.value, 
      nbp: nbpRefRate?.value,
      inflationDate: latestInflation?.date,
      nbpDate: nbpRefRate?.date
    };
  } catch (error) {
    console.error('Macro sync failed:', error);
    return null;
  }
}
