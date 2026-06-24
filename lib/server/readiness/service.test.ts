import { describe, expect, it, vi } from 'vitest';

import {
  checkReadinessDatabase,
  checkReadinessEnv,
  getReadinessSnapshot,
  REQUIRED_READINESS_TABLES,
  type SqlClient,
} from './service';

function completeEnv() {
  return {
    DATABASE_URL: 'postgres://example',
    AUTH_SECRET: 'auth-secret',
    SYNC_SECRET: 'sync-secret',
    NEXT_PUBLIC_APP_URL: 'https://example.com',
    AUTH_GOOGLE_ID: 'google-id',
    AUTH_GOOGLE_SECRET: 'google-secret',
  };
}

function createSqlClient(rows: Array<{ table_name: string }>, fail = false) {
  const end = vi.fn().mockResolvedValue(undefined);
  const sql = vi.fn(async (strings: TemplateStringsArray | readonly string[]) => {
    if (fail) {
      throw new Error('db failed');
    }

    return strings[0]?.includes('information_schema') ? rows : [];
  }) as unknown as SqlClient;
  sql.end = end;

  return sql;
}

describe('readiness service', () => {
  it('passes environment checks when database auth sync app url and oauth are configured', () => {
    expect(checkReadinessEnv(completeEnv())).toEqual({ status: 'ok' });
  });

  it('reports all missing environment requirements', () => {
    expect(checkReadinessEnv({})).toEqual({
      status: 'failed',
      detail:
        'Missing required runtime configuration: DATABASE_URL, AUTH_SECRET, SYNC_SECRET, NEXT_PUBLIC_APP_URL, OAUTH_PROVIDER',
    });
  });

  it('fails database checks without a database url', async () => {
    await expect(checkReadinessDatabase(undefined)).resolves.toEqual({
      status: 'failed',
      detail: 'DATABASE_URL is not configured',
    });
  });

  it('passes database checks when all required tables exist', async () => {
    const sql = createSqlClient(REQUIRED_READINESS_TABLES.map((table_name) => ({ table_name })));

    await expect(checkReadinessDatabase('postgres://example', () => sql)).resolves.toEqual({
      status: 'ok',
    });
    expect(sql.end).toHaveBeenCalledWith({ timeout: 1 });
  });

  it('reports missing required tables', async () => {
    const sql = createSqlClient([{ table_name: 'data_series' }]);

    await expect(checkReadinessDatabase('postgres://example', () => sql)).resolves.toEqual({
      status: 'failed',
      detail:
        'Missing required tables: data_points, polish_bonds, sync_runs, user, account, session, verification_token',
    });
  });

  it('returns a snapshot with service status and timestamp', async () => {
    const sql = createSqlClient(REQUIRED_READINESS_TABLES.map((table_name) => ({ table_name })));

    await expect(
      getReadinessSnapshot({
        env: completeEnv(),
        createSqlClient: () => sql,
        now: new Date('2026-06-15T12:00:00.000Z'),
      }),
    ).resolves.toEqual({
      ok: true,
      checks: {
        env: { status: 'ok' },
        database: { status: 'ok' },
      },
      timestamp: '2026-06-15T12:00:00.000Z',
    });
  });
});
