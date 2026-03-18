import { db } from "@/db";
import { dataSeries, dataPoints } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { SyncProvider } from "./types";
import { format, addMonths, startOfMonth, parseISO, isBefore } from "date-fns";

export class SyncEngine {
  constructor(private providers: SyncProvider[]) {}

  async syncAll(startYear: number = 1910) {
    const results = [];
    for (const provider of this.providers) {
      try {
        console.log(`[SyncEngine] Starting sync for ${provider.name}...`);
        const status = await this.syncProvider(provider, startYear);
        results.push(status);
      } catch (error) {
        console.error(`[SyncEngine] Failed sync for ${provider.name}:`, error);
        results.push({ provider: provider.name, error: String(error) });
      }
    }
    return results;
  }

  private async syncProvider(provider: SyncProvider, startYear: number) {
    // Determine typical slug for this provider to find last sync date
    const slugHint = provider.name.includes("Inflation") ? "pl-cpi" : 
                    (provider.name.includes("NBP") ? "gold-usd" : "sp500");

    const series = await db.query.dataSeries.findFirst({
      where: eq(dataSeries.slug, slugHint),
    });

    if (!series) {
      throw new Error(`Base series metadata for ${slugHint} not found. Run seed-series first.`);
    }

    const lastPoint = await db.query.dataPoints.findFirst({
      where: eq(dataPoints.seriesId, series.id),
      orderBy: [desc(dataPoints.date)],
    });

    let currentStartDate = lastPoint 
      ? addMonths(parseISO(lastPoint.date), 1) 
      : parseISO(`${startYear}-01-01`);
    
    currentStartDate = startOfMonth(currentStartDate);
    const today = startOfMonth(new Date());

    if (isBefore(today, currentStartDate)) {
      console.log(`[SyncEngine] ${provider.name} (${slugHint}) is already up to date.`);
      return { provider: provider.name, status: 'up-to-date' };
    }

    const startDateStr = format(currentStartDate, 'yyyy-MM-dd');
    const endDateStr = format(today, 'yyyy-MM-dd');

    console.log(`[SyncEngine] Fetching ${provider.name} from ${startDateStr} to ${endDateStr}...`);
    const data = await provider.fetchData(startDateStr, endDateStr);
    
    if (data.length === 0) {
      console.log(`[SyncEngine] No new data found for ${provider.name}.`);
      return { provider: provider.name, status: 'no-new-data' };
    }

    // Cache slug -> UUID mapping for this run
    const slugToId: Record<string, string> = {};
    
    console.log(`[SyncEngine] Saving ${data.length} records...`);
    let savedCount = 0;

    for (const record of data) {
      if (!slugToId[record.seriesSlug]) {
        const s = await db.query.dataSeries.findFirst({
          where: eq(dataSeries.slug, record.seriesSlug),
        });
        if (s) slugToId[record.seriesSlug] = s.id;
      }

      const seriesId = slugToId[record.seriesSlug];
      if (!seriesId) {
        console.warn(`[SyncEngine] Skipping record: series slug '${record.seriesSlug}' not found in DB.`);
        continue;
      }

      try {
        await db.insert(dataPoints).values({
          seriesId,
          date: record.date,
          value: record.value.toString(),
        }).onConflictDoUpdate({
          target: [dataPoints.seriesId, dataPoints.date],
          set: { value: record.value.toString() }
        });
        savedCount++;
      } catch (err) {
        console.error(`[SyncEngine] Error saving data point for ${record.seriesSlug} at ${record.date}:`, err);
      }
    }

    return { provider: provider.name, status: 'success', imported: savedCount };
  }
}
