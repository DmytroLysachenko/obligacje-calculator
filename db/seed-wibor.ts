import { db } from "./index";
import { dataSeries } from "./schema";
import "dotenv/config";

async function main() {
  try {
    await db.insert(dataSeries).values([
      {
        slug: "wibor-3m",
        name: "WIBOR 3M",
        category: "instrument",
        unit: "%",
        frequency: "monthly",
        dataSource: "Stooq",
      },
      {
        slug: "wibor-6m",
        name: "WIBOR 6M",
        category: "instrument",
        unit: "%",
        frequency: "monthly",
        dataSource: "Stooq",
      }
    ]).onConflictDoNothing();
    
    console.log("✅ Successfully seeded WIBOR 3M and 6M base metadata series.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to seed WIBOR series:", err);
    process.exit(1);
  }
}

main();
