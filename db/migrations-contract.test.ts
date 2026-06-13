import { readFileSync, readdirSync } from 'node:fs';
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

describe('database migration contracts', () => {
  it('keeps additive production migrations for sync history and Auth.js tables', () => {
    expect(migrationNames()).toEqual(expect.arrayContaining([
      '0001_sync_runs.sql',
      '0002_auth_tables.sql',
    ]));
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

  it('keeps migrations idempotent for shared preview and production databases', () => {
    for (const name of ['0001_sync_runs.sql', '0002_auth_tables.sql']) {
      const source = readMigration(name);

      expect(source).toContain('IF NOT EXISTS');
      expect(source).not.toContain('DROP TABLE');
      expect(source).not.toContain('TRUNCATE');
      expect(source).not.toContain('DELETE FROM');
    }
  });
});
