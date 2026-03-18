import * as dotenv from "dotenv";
dotenv.config();

import { sql } from "drizzle-orm";

async function testConnection() {
  try {
    // Dynamic import to ensure process.env is populated
    const { db } = await import("../db");
    const { dataSeries } = await import("../db/schema");

    if (!db.select) {
      throw new Error("Database client was not initialized properly. process.env.DATABASE_URL might be empty at the moment of db/index.ts execution.");
    }
    
    const result = await db.select({ count: sql<number>`count(*)` }).from(dataSeries);
    console.log("Database connection successful!");
    console.log("Current data series count:", result[0].count);
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

testConnection();
