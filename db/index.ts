import 'dotenv/config';
import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

const createDbClient = () => {
  if (!databaseUrl) {
    console.warn(
      "DATABASE_URL is not defined. Database operations will fail at runtime.",
    );
    return {} as unknown as NeonHttpDatabase<typeof schema>;
  }
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
};

export const db = createDbClient();
