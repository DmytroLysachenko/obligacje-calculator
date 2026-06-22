import postgres from 'postgres';

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

export interface ReadinessEnv {
  DATABASE_URL?: string;
  AUTH_SECRET?: string;
  NEXTAUTH_SECRET?: string;
  AUTH_GOOGLE_ID?: string;
  AUTH_GOOGLE_SECRET?: string;
  AUTH_FACEBOOK_ID?: string;
  AUTH_FACEBOOK_SECRET?: string;
  SYNC_SECRET?: string;
  NEXT_PUBLIC_APP_URL?: string;
}

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
  const hasAuthSecret = Boolean(env.AUTH_SECRET || env.NEXTAUTH_SECRET);
  const hasOAuthProvider = Boolean(
    (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET)
      || (env.AUTH_FACEBOOK_ID && env.AUTH_FACEBOOK_SECRET),
  );
  const missing = [
    !env.DATABASE_URL ? 'DATABASE_URL' : null,
    !hasAuthSecret ? 'AUTH_SECRET' : null,
    !env.SYNC_SECRET ? 'SYNC_SECRET' : null,
    !env.NEXT_PUBLIC_APP_URL ? 'NEXT_PUBLIC_APP_URL' : null,
    !hasOAuthProvider ? 'OAUTH_PROVIDER' : null,
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
  env = process.env as ReadinessEnv,
  createSqlClient,
  now = new Date(),
}: {
  env?: ReadinessEnv;
  createSqlClient?: SqlFactory;
  now?: Date;
} = {}): Promise<ReadinessSnapshot> {
  const checks = {
    env: checkReadinessEnv(env),
    database: await checkReadinessDatabase(env.DATABASE_URL, createSqlClient),
  };
  const ok = Object.values(checks).every((check) => check.status === 'ok');

  return {
    ok,
    checks,
    timestamp: now.toISOString(),
  };
}
