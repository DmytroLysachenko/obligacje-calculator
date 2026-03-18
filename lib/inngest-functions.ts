import { inngest } from "./inngest";
import { SyncEngine } from "./sync/sync-engine";
import { NbpSyncProvider } from "./sync/providers/nbp";
import { StooqSyncProvider } from "./sync/providers/stooq";
import { GusSyncProvider } from "./sync/providers/gus";
import { WorldBankSyncProvider } from "./sync/providers/worldbank";

export const syncEconomicData = inngest.createFunction(
  { 
    id: "sync-economic-data",
    retries: 3, 
  },
  { cron: "0 2,14 * * *" }, // Run twice a day (2 AM and 2 PM)
  async ({ step }) => {
    const engine = new SyncEngine([
      new NbpSyncProvider(),
      new StooqSyncProvider(),
      new GusSyncProvider(),
      new WorldBankSyncProvider()
    ]);

    // Perform a full sync from the last known point in the DB
    // (SyncEngine internally handles finding the last date)
    const results = await step.run("unified-sync", async () => {
      try {
        const startYear = 2020; // Default lookback if series is empty
        return await engine.syncAll(startYear);
      } catch (error) {
        console.error('Unified Sync Error:', error);
        throw error; 
      }
    });
    
    return { status: "completed", results };
  }
);
