import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

let portfolioSchemaCompatPromise: Promise<void> | null = null;

export async function ensurePortfolioSchemaCompat() {
  if (!process.env.DATABASE_URL) {
    return;
  }

  if (portfolioSchemaCompatPromise) {
    return portfolioSchemaCompatPromise;
  }

  const sql = neon(process.env.DATABASE_URL);

  portfolioSchemaCompatPromise = (async () => {
    await sql`
      ALTER TABLE user_portfolios
      ADD COLUMN IF NOT EXISTS share_id uuid DEFAULT gen_random_uuid()
    `;

    await sql`
      ALTER TABLE user_portfolios
      ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false
    `;

    await sql`
      UPDATE user_portfolios
      SET share_id = gen_random_uuid()
      WHERE share_id IS NULL
    `;

    await sql`
      UPDATE user_portfolios
      SET is_public = false
      WHERE is_public IS NULL
    `;

    await sql`
      ALTER TABLE user_portfolios
      ALTER COLUMN is_public SET DEFAULT false
    `;

    await sql`
      ALTER TABLE user_portfolios
      ALTER COLUMN is_public SET NOT NULL
    `;

    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS user_portfolios_share_id_idx
      ON user_portfolios (share_id)
    `;
  })().catch((error) => {
    portfolioSchemaCompatPromise = null;
    throw error;
  });

  return portfolioSchemaCompatPromise;
}
