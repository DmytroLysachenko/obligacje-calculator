import * as dotenv from "dotenv";
dotenv.config();

async function run() {
  const { SyncEngine } = await import("./sync-engine");
  const { NbpSyncProvider } = await import("./providers/nbp");
  const { StooqSyncProvider } = await import("./providers/stooq");
  const { WorldBankSyncProvider } = await import("./providers/worldbank");
  const { GusSyncProvider } = await import("./providers/gus");

  const engine = new SyncEngine([
    new NbpSyncProvider(),
    new StooqSyncProvider(),
    new WorldBankSyncProvider(),
    new GusSyncProvider()
  ]);

  const startYear = 1990;
  console.log(`[CLI Sync] Starting full unified sync from ${startYear}...`);

  try {
    const results = await engine.syncAll(startYear);
    console.log("[CLI Sync] Results:", JSON.stringify(results, null, 2));
  } catch (error) {
    console.error("[CLI Sync] Fatal error:", error);
  } finally {
    process.exit(0);
  }
}

run();
