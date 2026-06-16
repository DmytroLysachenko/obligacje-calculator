import { NextResponse } from 'next/server';
import postgres from 'postgres';

type CheckStatus = 'ok' | 'failed';

type ReadinessCheck = {
  status: CheckStatus;
  detail?: string;
};

const requiredTables = [
  'data_series',
  'data_points',
  'polish_bonds',
  'sync_runs',
  'user',
  'account',
  'session',
  'verification_token',
];

function envCheck(): ReadinessCheck {
  const hasAuthSecret = Boolean(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET);
  const hasOAuthProvider = Boolean(
    (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)
      || (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET),
  );
  const missing = [
    !process.env.DATABASE_URL ? 'DATABASE_URL' : null,
    !hasAuthSecret ? 'AUTH_SECRET' : null,
    !process.env.SYNC_SECRET ? 'SYNC_SECRET' : null,
    !process.env.NEXT_PUBLIC_APP_URL ? 'NEXT_PUBLIC_APP_URL' : null,
    !hasOAuthProvider ? 'OAUTH_PROVIDER' : null,
  ].filter(Boolean);

  return missing.length === 0
    ? { status: 'ok' }
    : { status: 'failed', detail: `Missing required runtime configuration: ${missing.join(', ')}` };
}

async function databaseCheck(): Promise<ReadinessCheck> {
  if (!process.env.DATABASE_URL) {
    return { status: 'failed', detail: 'DATABASE_URL is not configured' };
  }

  const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 3, connect_timeout: 5 });

  try {
    await sql`select 1`;
    const rows = await sql<{ table_name: string }[]>`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ${sql(requiredTables)}
    `;
    const existingTables = new Set(rows.map((row) => row.table_name));
    const missingTables = requiredTables.filter((table) => !existingTables.has(table));

    return missingTables.length === 0
      ? { status: 'ok' }
      : { status: 'failed', detail: `Missing required tables: ${missingTables.join(', ')}` };
  } catch {
    return { status: 'failed', detail: 'Database readiness check failed' };
  } finally {
    await sql.end({ timeout: 1 });
  }
}

export async function GET() {
  const checks = {
    env: envCheck(),
    database: await databaseCheck(),
  };
  const ok = Object.values(checks).every((check) => check.status === 'ok');

  return NextResponse.json(
    {
      ok,
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
