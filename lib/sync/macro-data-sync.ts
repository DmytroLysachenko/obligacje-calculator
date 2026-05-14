import { db } from "@/db";
import { dataSeries, dataPoints } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NbpApiClient } from "../api-clients/nbp";

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
 * Syncs trusted macroeconomic data for retained surfaces.
 * NBP reference-rate history is synced from official NBP data.
 * CPI remains explicit about partial coverage until a stable official monthly source is wired in.
 */
export async function syncMacroData() {
  const nbpClient = new NbpApiClient();

  try {
    const nbpIndicators = await retry(() => nbpClient.fetchReferenceRateHistory());
    const latestNbpRate = nbpIndicators[0];

    let nbpSeries = await db.query.dataSeries.findFirst({
      where: eq(dataSeries.slug, 'nbp-ref-rate'),
    });

    if (!nbpSeries) {
      [nbpSeries] = await db
        .insert(dataSeries)
        .values({
          slug: 'nbp-ref-rate',
          name: 'NBP Reference Rate',
          category: 'macro',
          unit: '%',
          frequency: 'on-event',
          dataSource: 'NBP official API',
          freshnessPolicy: 'check-daily',
          lastSyncStatus: 'success',
        })
        .returning();
    }

    if (nbpIndicators.length > 0 && nbpSeries) {
      await db
        .insert(dataPoints)
        .values(
          nbpIndicators.map((indicator) => ({
            seriesId: nbpSeries.id,
            date: indicator.date,
            value: indicator.value.toString(),
            qualityFlag: 'verified',
            sourceMetadata: 'NBP official API',
          })),
        )
        .onConflictDoUpdate({
          target: [dataPoints.seriesId, dataPoints.date],
          set: {
            value: sql`EXCLUDED.value`,
            qualityFlag: 'verified',
            sourceMetadata: 'NBP official API',
          },
        });

      await db
        .update(dataSeries)
        .set({
          dataSource: 'NBP official API',
          lastDataPointDate: latestNbpRate?.date,
          lastSyncStatus: 'success',
          lastSyncError: null,
          updatedAt: new Date(),
        })
        .where(eq(dataSeries.id, nbpSeries.id));
    }

    const cpiSeries = await db.query.dataSeries.findFirst({
      where: eq(dataSeries.slug, 'pl-cpi'),
    });

    if (cpiSeries) {
      await db
        .update(dataSeries)
        .set({
          dataSource: cpiSeries.dataSource ?? 'GUS/WorldBank',
          lastSyncStatus: 'partial',
          lastSyncError:
            'Monthly CPI sync is not yet sourced from a stable official feed. Existing coverage remains reference-only.',
          updatedAt: new Date(),
        })
        .where(eq(dataSeries.id, cpiSeries.id));
    }

    const results = {
      inflation: null,
      nbp: latestNbpRate?.value ?? null,
      wibor3m: null,
      wibor6m: null,
    };

    return results;
  } catch (error) {
    console.error('Macro sync failed:', error);
    const nbpSeries = await db.query.dataSeries.findFirst({
      where: eq(dataSeries.slug, 'nbp-ref-rate'),
    });

    if (nbpSeries) {
      await db
        .update(dataSeries)
        .set({
          lastSyncStatus: 'failed',
          lastSyncError: String(error),
          updatedAt: new Date(),
        })
        .where(eq(dataSeries.id, nbpSeries.id));
    }

    return null;
  }
}
