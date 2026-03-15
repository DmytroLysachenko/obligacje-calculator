import { inngest } from "./inngest";
import { NbpApiClient } from "./api-clients/nbp";
import { StooqApiClient } from "./api-clients/stooq";
import { db } from "@/db";
import { economicIndicators } from "@/db/schema";

export const syncEconomicData = inngest.createFunction(
  { id: "sync-economic-data" },
  { cron: "0 2,14 * * *" }, // Run twice a day (2 AM and 2 PM)
  async ({ step }) => {
    const nbp = new NbpApiClient();
    const stooq = new StooqApiClient();

    // 1. Fetch NBP Data
    const nbpData = await step.run("fetch-nbp-data", async () => {
      return await nbp.fetchLatestData();
    });

    // 2. Fetch Stooq Data (S&P 500)
    const stooqData = await step.run("fetch-stooq-data", async () => {
      return await stooq.fetchHistoricalData("^SPX");
    });

    // 3. Upsert to Database
    await step.run("upsert-to-db", async () => {
      const allData = [...nbpData, ...stooqData];
      
      for (const item of allData) {
        await db.insert(economicIndicators).values({
          indicatorName: item.name,
          value: item.value,
          date: item.date,
          metadata: item.metadata,
        }).onConflictDoUpdate({
          target: [economicIndicators.indicatorName, economicIndicators.date],
          set: { 
            value: item.value,
            updatedAt: new Date()
          }
        });
      }
      
      return { count: allData.length };
    });
  }
);
