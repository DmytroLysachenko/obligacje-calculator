import { inngest } from "./inngest";
import { createDefaultSyncEngine } from "./sync/create-sync-engine";

export const syncEconomicData = inngest.createFunction(
  { 
    id: "sync-economic-data",
    retries: 3, 
  },
  { cron: "0 2,14 * * *" }, // Run twice a day (2 AM and 2 PM)
  async ({ step }) => {
    const engine = createDefaultSyncEngine('InngestSync');

    const results = await step.run("unified-sync", async () => {
      try {
        return await engine.runFullSync();
      } catch (error) {
        console.error('Unified Sync Error:', error);
        throw error; 
      }
    });
    
    return { status: "completed", results };
  }
);
