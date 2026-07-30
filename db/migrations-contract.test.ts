import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();
const drizzleDir = join(root, 'drizzle');

function readMigration(name: string) {
  return readFileSync(join(drizzleDir, name), 'utf8');
}

function migrationNames() {
  return readdirSync(drizzleDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();
}

function journalTags() {
  const journal = JSON.parse(readFileSync(join(drizzleDir, 'meta/_journal.json'), 'utf8')) as {
    entries: Array<{ tag: string }>;
  };
  return journal.entries.map((entry) => entry.tag);
}

describe('database migration contracts', () => {
  it('keeps additive production migrations for sync history and Auth.js tables', () => {
    expect(migrationNames()).toEqual(
      expect.arrayContaining([
        '0001_sync_runs.sql',
        '0002_auth_tables.sql',
        '0003_portfolio_lot_indexes.sql',
        '0004_portfolio_share_schema.sql',
        '0005_share_retention_and_constraints.sql',
        '0006_admin_audit_events.sql',
        '0007_shared_rate_limit_windows.sql',
        '0008_web_vital_aggregates.sql',
      ]),
    );
  });

  it('registers every reviewed migration in the Drizzle execution journal', () => {
    expect(journalTags()).toEqual(
      expect.arrayContaining([
        '0000_unified_schema',
        '0001_sync_runs',
        '0002_auth_tables',
        '0003_portfolio_lot_indexes',
        '0004_portfolio_share_schema',
        '0005_share_retention_and_constraints',
        '0006_admin_audit_events',
        '0007_shared_rate_limit_windows',
        '0008_web_vital_aggregates',
      ]),
    );
  });

  it('keeps sync run history table available for freshness reporting', () => {
    const source = readMigration('0001_sync_runs.sql');

    expect(source).toContain('CREATE TABLE IF NOT EXISTS "sync_runs"');
    expect(source).toContain('"latest_data_point_date" date');
    expect(source).toContain('CREATE INDEX IF NOT EXISTS "sync_runs_scope_idx"');
    expect(source).toContain('CREATE INDEX IF NOT EXISTS "sync_runs_series_slug_idx"');
    expect(source).toContain('CREATE INDEX IF NOT EXISTS "sync_runs_started_at_idx"');
  });

  it('keeps Auth.js adapter tables in migration coverage', () => {
    const source = readMigration('0002_auth_tables.sql');

    expect(source).toContain('CREATE TABLE IF NOT EXISTS "user"');
    expect(source).toContain('CREATE TABLE IF NOT EXISTS "account"');
    expect(source).toContain('CREATE TABLE IF NOT EXISTS "session"');
    expect(source).toContain('CREATE TABLE IF NOT EXISTS "verificationToken"');
    expect(source).toContain('CONSTRAINT "user_email_unique" UNIQUE ("email")');
    expect(source).toContain('PRIMARY KEY ("provider", "providerAccountId")');
    expect(source).toContain('FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade');
    expect(source).toContain('PRIMARY KEY ("identifier", "token")');
    expect(source).toContain('CREATE INDEX IF NOT EXISTS "account_userId_idx"');
    expect(source).toContain('CREATE INDEX IF NOT EXISTS "session_userId_idx"');
  });

  it('keeps portfolio lot ownership indexes permissive for real purchase patterns', () => {
    const source = readMigration('0003_portfolio_lot_indexes.sql');

    expect(source).toContain('ALTER COLUMN "portfolio_id" SET NOT NULL');
    expect(source).toContain('DROP INDEX IF EXISTS "lot_purchase_date_idx"');
    expect(source).toContain('DROP INDEX IF EXISTS "lot_portfolio_idx"');
    expect(source).toContain('CREATE INDEX IF NOT EXISTS "lot_portfolio_idx"');
    expect(source).toContain('CREATE INDEX IF NOT EXISTS "lot_portfolio_purchase_date_idx"');
    expect(source).not.toContain('CREATE UNIQUE INDEX');
  });

  it('moves portfolio sharing schema changes into an ordered migration', () => {
    const source = readMigration('0004_portfolio_share_schema.sql');

    expect(source).toContain('ADD COLUMN IF NOT EXISTS "share_id"');
    expect(source).toContain('ADD COLUMN IF NOT EXISTS "is_public"');
    expect(source).toContain('CREATE TABLE IF NOT EXISTS "shared_single_scenarios"');
    expect(source).toContain('CREATE UNIQUE INDEX IF NOT EXISTS "user_portfolios_share_id_idx"');
  });

  it('keeps portfolio lot schema aligned with non-unique purchase date indexes', () => {
    const source = readFileSync(join(root, 'db/schema.ts'), 'utf8');

    expect(source).toContain("portfolioId: uuid('portfolio_id')");
    expect(source).toContain('.notNull()');
    expect(source).toContain("index('lot_portfolio_idx')");
    expect(source).toContain("index('lot_portfolio_purchase_date_idx')");
    expect(source).not.toContain("uniqueIndex('lot_purchase_date_idx')");
  });

  it('keeps migrations idempotent for shared preview and production databases', () => {
    for (const name of ['0001_sync_runs.sql', '0002_auth_tables.sql']) {
      const source = readMigration(name);

      expect(source).toContain('IF NOT EXISTS');
      expect(source).not.toContain('DROP TABLE');
      expect(source).not.toContain('TRUNCATE');
      expect(source).not.toContain('DELETE FROM');
    }
  });

  it('bounds public share retention and enforces persisted financial invariants', () => {
    const source = readMigration('0005_share_retention_and_constraints.sql');

    expect(source).toContain('ADD COLUMN IF NOT EXISTS "expires_at"');
    expect(source).toContain('ALTER COLUMN "expires_at" SET NOT NULL');
    expect(source).toContain('shared_single_scenarios_expires_at_idx');
    expect(source).toContain('user_investment_lots_positive_amount');
    expect(source).toContain('shared_single_scenarios_nonempty_title');
  });

  it('stores web vitals only as bounded, aggregate-only retention records', () => {
    const source = readMigration('0008_web_vital_aggregates.sql');

    expect(source).toContain('CREATE TABLE IF NOT EXISTS "web_vital_aggregates"');
    expect(source).toContain('PRIMARY KEY ("metric", "path", "rating", "time_bucket")');
    expect(source).toContain('"sample_count" integer NOT NULL');
    expect(source).toContain('"value_sum" numeric(20, 4)');
    expect(source).toContain('web_vital_aggregates_time_bucket_idx');
    expect(source).not.toContain('user_agent');
    expect(source).not.toContain('account_id');
    expect(source).not.toContain('raw_url');
    expect(source).not.toContain('payload');
  });
});
