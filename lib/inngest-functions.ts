import { inngest } from "./inngest";
import { SyncEngine } from "./sync/sync-engine";
import { NbpSyncProvider } from "./sync/providers/nbp";
import { StooqSyncProvider } from "./sync/providers/stooq";
import { GusSyncProvider } from "./sync/providers/gus";
import { WorldBankSyncProvider } from "./sync/providers/worldbank";
import { db } from "@/db";
import { userInvestmentLots, communityInsights } from "@/db/schema";
import { sql } from "drizzle-orm";

export const aggregateCommunityInsights = inngest.createFunction(
  { id: "aggregate-community-insights" },
  { cron: "0 4 * * *" }, // Run daily at 4 AM
  async ({ step }) => {
    await step.run("aggregate-lots", async () => {
      // 1. Clear or update existing insights
      // In a real scenario, we'd use a more sophisticated grouping
      const stats = await db.select({
        bondType: userInvestmentLots.bondType,
        count: sql<number>`count(distinct ${userInvestmentLots.portfolioId})`.mapWith(Number),
        volume: sql<number>`sum(${userInvestmentLots.amount})`.mapWith(Number),
      })
      .from(userInvestmentLots)
      .groupBy(userInvestmentLots.bondType);

      for (const stat of stats) {
        await db.insert(communityInsights).values({
          bondType: stat.bondType,
          popularityScore: stat.count,
          totalVolume: stat.volume.toString(),
          sentimentScore: "0.00", // Placeholder for actual sentiment analysis
        })
        .onConflictDoUpdate({
          target: communityInsights.bondType,
          set: {
            popularityScore: stat.count,
            totalVolume: stat.volume.toString(),
            updatedAt: new Date(),
          }
        });
      }
    });

    return { status: "completed" };
  }
);

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
