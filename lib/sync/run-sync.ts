import * as dotenv from "dotenv";
dotenv.config();

async function run() {
  const { createDefaultSyncEngine } = await import("./create-sync-engine");
  const engine = createDefaultSyncEngine("CLI Sync");

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
