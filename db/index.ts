import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

// During build time or if env is missing, we shouldn't crash the build
const createDbClient = () => {
  if (!databaseUrl) {
    console.warn(
      "DATABASE_URL is not defined. Database operations will fail at runtime.",
    );
    // Return a "fake" client or null-safe object for build time
    return {} as unknown as NeonHttpDatabase<typeof schema>;
  }
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
};

export const db = createDbClient();
