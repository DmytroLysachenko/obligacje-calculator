import { db } from "@/db";
import { economicIndicators } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
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
    // 1. Determine which indicators this provider handles
    // We'll dry-run fetch to see indicator names or use a mapping
    // For now, let's assume we fetch all and let the engine find the "oldest" last date 
    // among typical indicators for that provider.
    
    // Better: let's just use the specific provider's logic to fetch data
    // and let the DB handle the "already exists" part.
    // However, to know WHERE TO START, we need a hint.
    
    const indicatorHint = provider.name.includes("Inflation") ? "inflation_pl" : 
                         (provider.name.includes("NBP") ? "gold_price" : "sp500");

    const lastRecord = await db.query.economicIndicators.findFirst({
      where: eq(economicIndicators.indicatorName, indicatorHint),
      orderBy: [desc(economicIndicators.date)],
    });

    let currentStartDate = lastRecord 
      ? addMonths(parseISO(lastRecord.date), 1) 
      : parseISO(`${startYear}-01-01`);
    
    currentStartDate = startOfMonth(currentStartDate);
    const today = startOfMonth(new Date());

    if (isBefore(today, currentStartDate)) {
      console.log(`[SyncEngine] ${provider.name} (${indicatorHint}) is already up to date.`);
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

    console.log(`[SyncEngine] Saving ${data.length} records for ${provider.name}...`);
    
    let savedCount = 0;
    const chunkSize = 100;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      
      for (const record of chunk) {
        try {
          await db.insert(economicIndicators).values({
            indicatorName: record.indicatorName,
            date: record.date,
            value: record.value.toString(),
            updatedAt: new Date(),
          }).onConflictDoUpdate({
            target: [economicIndicators.indicatorName, economicIndicators.date],
            set: { 
              value: record.value.toString(),
              updatedAt: new Date()
            }
          });
          savedCount++;
        } catch (err) {
          console.error(`[SyncEngine] Error saving record ${record.indicatorName} for ${record.date}:`, err);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return { provider: provider.name, status: 'success', imported: savedCount };
  }
}
