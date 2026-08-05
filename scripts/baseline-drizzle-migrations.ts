import 'dotenv/config';

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import postgres from 'postgres';

const LEGACY_TABLES = [
  'data_points',
  'data_series',
  'economic_indicators',
  'investment_instruments',
  'polish_bonds',
  'user_investment_lots',
  'user_portfolios',
  'sync_runs',
  'user',
  'account',
  'session',
  'verificationToken',
] as const;
const LEGACY_TYPES = ['instrument_type', 'interest_type', 'series_category'] as const;
const REPAIRABLE_LEGACY_TABLE = 'economic_indicators';
const BASELINE_MIGRATION_COUNT = 3;
const MIGRATIONS_DIR = join(process.cwd(), 'drizzle');

export function isCompleteLegacyBaseline({ tables, types }: { tables: string[]; types: string[] }) {
  return (
    LEGACY_TABLES.filter((table) => table !== REPAIRABLE_LEGACY_TABLE).every((table) =>
      tables.includes(table),
    ) && LEGACY_TYPES.every((type) => types.includes(type))
  );
}

function hasLegacyObjects({ tables, types }: { tables: string[]; types: string[] }) {
  return tables.length > 0 || types.length > 0;
}

function readBaselineMigrations() {
  const journalPath = join(MIGRATIONS_DIR, 'meta', '_journal.json');
  if (!existsSync(journalPath)) {
    throw new Error('Drizzle migration journal is missing.');
  }

  const journal = JSON.parse(readFileSync(journalPath, 'utf8')) as {
    entries: Array<{ tag: string; when: number }>;
  };

  return journal.entries.slice(0, BASELINE_MIGRATION_COUNT).map((entry) => {
    const migrationPath = join(MIGRATIONS_DIR, `${entry.tag}.sql`);
    const sql = readFileSync(migrationPath, 'utf8');

    return {
      hash: createHash('sha256').update(sql).digest('hex'),
      createdAt: entry.when,
    };
  });
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to baseline Drizzle migrations.');
  }

  const sql = postgres(connectionString, { max: 1 });

  try {
    const [tables, types] = await Promise.all([
      sql<{ table_name: string }[]>`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `,
      sql<{ typname: string }[]>`
        SELECT typname
        FROM pg_type
        WHERE typnamespace = 'public'::regnamespace
      `,
    ]);
    const state = {
      tables: tables.map((row) => row.table_name),
      types: types.map((row) => row.typname),
    };

    if (!hasLegacyObjects(state)) {
      console.log('Fresh database detected; no migration baseline is needed.');
      return;
    }

    if (!isCompleteLegacyBaseline(state)) {
      throw new Error(
        'Database has a partial legacy schema; refusing to infer a Drizzle migration baseline.',
      );
    }

    if (!state.tables.includes(REPAIRABLE_LEGACY_TABLE)) {
      await sql`
        CREATE TABLE public.economic_indicators (
          id serial PRIMARY KEY,
          indicator_name text NOT NULL,
          date date NOT NULL,
          value numeric(15, 6) NOT NULL,
          updated_at timestamp DEFAULT now()
        )
      `;
      console.log('Restored missing economic_indicators table from migration 0000.');
    }

    await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
    await sql`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `;
    const [migrationCount] = await sql<{ count: string }[]>`
      SELECT count(*) FROM drizzle.__drizzle_migrations
    `;

    if (Number(migrationCount?.count ?? 0) > 0) {
      console.log('Drizzle migration ledger already exists; no baseline is needed.');
      return;
    }

    const baselineMigrations = readBaselineMigrations();
    await sql.begin(async (transaction) => {
      for (const migration of baselineMigrations) {
        await transaction.unsafe(
          'INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)',
          [migration.hash, migration.createdAt],
        );
      }
    });
    console.log('Recorded legacy Drizzle baseline through migration 0002.');
  } finally {
    await sql.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
