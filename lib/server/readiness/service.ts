import postgres from 'postgres';

import {
  getDatabaseUrl,
  getPublicAppUrl,
  getSyncSecret,
  hasAuthSecret,
  hasOAuthProvider,
  isOAuthOptionalPreview,
  readRuntimeEnv,
  type RuntimeEnv,
} from '@/lib/server/runtime/env';

type ReadinessCheckStatus = 'ok' | 'failed';

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
  'verificationToken',
  'shared_single_scenarios',
  'admin_audit_events',
  'rate_limit_windows',
  'web_vital_aggregates',
];
const DRIZZLE_MIGRATIONS_TABLE = 'drizzle.__drizzle_migrations';
/** Bump with every reviewed migration added to the journal. */
export const REQUIRED_MIGRATION_COUNT = 9;

export function checkReadinessEnv(env: ReadinessEnv): ReadinessCheck {
  const missing = [
    !getDatabaseUrl(env) ? 'DATABASE_URL' : null,
    !hasAuthSecret(env) ? 'AUTH_SECRET' : null,
    !getSyncSecret(env) ? 'SYNC_SECRET' : null,
    !getPublicAppUrl(env) ? 'NEXT_PUBLIC_APP_URL' : null,
    !hasOAuthProvider(env) && !isOAuthOptionalPreview(env) ? 'OAUTH_PROVIDER' : null,
  ].filter((value): value is string => Boolean(value));

  return missing.length === 0
    ? { status: 'ok' }
    : { status: 'failed', detail: `Missing required runtime configuration: ${missing.join(', ')}` };
}

export async function checkReadinessDatabase(
  databaseUrl: string | undefined,
  createSqlClient: SqlFactory = (url) =>
    postgres(url, { max: 1, idle_timeout: 3, connect_timeout: 5 }) as SqlClient,
): Promise<ReadinessCheck> {
  if (!databaseUrl) {
    return { status: 'failed', detail: 'DATABASE_URL is not configured' };
  }

  const sql = createSqlClient(databaseUrl);

  try {
    await sql`select 1`;
    const rows = await sql<{ table_schema: string; table_name: string }[]>`
      select table_schema, table_name
      from information_schema.tables
      where (table_schema = 'public' and table_name in ${sql(REQUIRED_READINESS_TABLES)})
        or (table_schema = 'drizzle' and table_name = '__drizzle_migrations')
    `;
    const existingTables = new Set(rows.map((row) => `${row.table_schema}.${row.table_name}`));
    const missingTables = [
      ...REQUIRED_READINESS_TABLES.filter((table) => !existingTables.has(`public.${table}`)),
      ...(existingTables.has(DRIZZLE_MIGRATIONS_TABLE) ? [] : [DRIZZLE_MIGRATIONS_TABLE]),
    ];

    if (missingTables.length > 0) {
      return { status: 'failed', detail: `Missing required tables: ${missingTables.join(', ')}` };
    }

    const migrationRows = await sql<{ migration_count: number }[]>`
      select count(*)::int as migration_count from drizzle.__drizzle_migrations
    `;
    const migrationCount = migrationRows[0]?.migration_count ?? 0;

    return migrationCount >= REQUIRED_MIGRATION_COUNT
      ? { status: 'ok' }
      : {
          status: 'failed',
          detail: `Database migrations are behind: expected at least ${REQUIRED_MIGRATION_COUNT}, found ${migrationCount}`,
        };
  } catch {
    return { status: 'failed', detail: 'Database readiness check failed' };
  } finally {
    await sql.end({ timeout: 1 });
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
