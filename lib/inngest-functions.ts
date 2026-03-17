import { inngest } from "./inngest";
import { NbpApiClient } from "./api-clients/nbp";
import { StooqApiClient } from "./api-clients/stooq";
import { db } from "@/db";
import { economicIndicators } from "@/db/schema";

export const syncEconomicData = inngest.createFunction(
  { 
    id: "sync-economic-data",
    retries: 3, // Enable retries at function level
  },
  { cron: "0 2,14 * * *" }, // Run twice a day (2 AM and 2 PM)
  async ({ step }) => {
    const nbp = new NbpApiClient();
    const stooq = new StooqApiClient();

    // 1. Fetch NBP Data
    const nbpData = await step.run("fetch-nbp-data", async () => {
      try {
        return await nbp.fetchLatestData();
      } catch (error) {
        console.error('NBP Fetch Error:', error);
        throw error; // Re-throw for Inngest retry
      }
    });

    // 2. Fetch Stooq Data (S&P 500)
    const stooqData = await step.run("fetch-stooq-data", async () => {
      try {
        return await stooq.fetchHistoricalData("^SPX");
      } catch (error) {
        console.error('Stooq Fetch Error:', error);
        throw error;
      }
    });

    // 3. Upsert to Database
    await step.run("upsert-to-db", async () => {
      const allData = [...nbpData, ...stooqData];
      
      let upsertedCount = 0;
      for (const item of allData) {
        try {
          await db.insert(economicIndicators).values({
            indicatorName: item.name,
            value: item.value.toString(),
            date: item.date,
          }).onConflictDoUpdate({
            target: [economicIndicators.indicatorName, economicIndicators.date],
            set: { 
              value: item.value.toString(),
              updatedAt: new Date()
            }
          });
          upsertedCount++;
        } catch (error) {
          console.warn(`Failed to upsert item ${item.name} for ${item.date}:`, error);
          // Don't fail the whole batch for one item, but log it
        }
      }
      
      return { count: allData.length, upserted: upsertedCount };
    });
  }
);
