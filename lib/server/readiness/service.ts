import postgres from 'postgres';
import {
  getDatabaseUrl,
  getPublicAppUrl,
  getSyncSecret,
  hasAuthSecret,
  hasOAuthProvider,
  readRuntimeEnv,
  type RuntimeEnv,
} from '@/lib/server/runtime/env';

export type ReadinessCheckStatus = 'ok' | 'failed';

export interface ReadinessCheck {
  status: ReadinessCheckStatus;
  detail?: string;
}

export interface ReadinessSnapshot {
  ok: boolean;
  checks: {
    env: ReadinessCheck;
    database: ReadinessCheck;
  };
  timestamp: string;
}

export type ReadinessEnv = RuntimeEnv;

export type SqlClient = {
  <T = unknown>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>;
  (values: readonly string[]): unknown;
  end: (options: { timeout: number }) => Promise<void>;
};

type SqlFactory = (databaseUrl: string) => SqlClient;

export const REQUIRED_READINESS_TABLES = [
  'data_series',
  'data_points',
  'polish_bonds',
  'sync_runs',
  'user',
  'account',
  'session',
  'verification_token',
];

export function checkReadinessEnv(env: ReadinessEnv): ReadinessCheck {
  const missing = [
    !getDatabaseUrl(env) ? 'DATABASE_URL' : null,
    !hasAuthSecret(env) ? 'AUTH_SECRET' : null,
    !getSyncSecret(env) ? 'SYNC_SECRET' : null,
    !getPublicAppUrl(env) ? 'NEXT_PUBLIC_APP_URL' : null,
    !hasOAuthProvider(env) ? 'OAUTH_PROVIDER' : null,
  ].filter((value): value is string => Boolean(value));

  return missing.length === 0
    ? {status: 'ok'}
    : {status: 'failed', detail: `Missing required runtime configuration: ${missing.join(', ')}`};
}

export async function checkReadinessDatabase(
  databaseUrl: string | undefined,
  createSqlClient: SqlFactory = (url) => postgres(url, {max: 1, idle_timeout: 3, connect_timeout: 5}) as SqlClient,
): Promise<ReadinessCheck> {
  if (!databaseUrl) {
    return {status: 'failed', detail: 'DATABASE_URL is not configured'};
  }

  const sql = createSqlClient(databaseUrl);

  try {
    await sql`select 1`;
    const rows = await sql<{table_name: string}[]>`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ${sql(REQUIRED_READINESS_TABLES)}
    `;
    const existingTables = new Set(rows.map((row) => row.table_name));
    const missingTables = REQUIRED_READINESS_TABLES.filter((table) => !existingTables.has(table));

    return missingTables.length === 0
      ? {status: 'ok'}
      : {status: 'failed', detail: `Missing required tables: ${missingTables.join(', ')}`};
  } catch {
    return {status: 'failed', detail: 'Database readiness check failed'};
  } finally {
    await sql.end({timeout: 1});
  }
}

export async function getReadinessSnapshot({
  env = readRuntimeEnv(),
  createSqlClient,
  now = new Date(),
}: {
  env?: ReadinessEnv;
  createSqlClient?: SqlFactory;
  now?: Date;
} = {}): Promise<ReadinessSnapshot> {
  const checks = {
    env: checkReadinessEnv(env),
    database: await checkReadinessDatabase(getDatabaseUrl(env), createSqlClient),
  };
  const ok = Object.values(checks).every((check) => check.status === 'ok');

  return {
    ok,
    checks,
    timestamp: now.toISOString(),
  };
}
