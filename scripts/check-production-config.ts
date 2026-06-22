import 'dotenv/config';
import {
  getConfiguredOAuthProviders,
  getDatabaseUrl,
  getPublicAppUrl,
  getSyncSecret,
  hasAuthSecret,
  readRuntimeEnv,
} from '../lib/server/runtime/env';

interface ConfigCheck {
  label: string;
  ok: boolean;
  hint: string;
}

function createChecks() {
  const env = readRuntimeEnv();

  return [
    {
      label: 'DATABASE_URL',
      ok: Boolean(getDatabaseUrl(env)),
      hint: 'Set the production Postgres connection string.',
    },
    {
      label: 'AUTH_SECRET',
      ok: hasAuthSecret(env),
      hint: 'Set AUTH_SECRET, or NEXTAUTH_SECRET while migrating legacy config.',
    },
    {
      label: 'NEXT_PUBLIC_APP_URL',
      ok: Boolean(getPublicAppUrl(env)),
      hint: 'Set the canonical deployed URL used by metadata and shared links.',
    },
    {
      label: 'SYNC_SECRET',
      ok: Boolean(getSyncSecret(env)),
      hint: 'Set the secret used by admin sync/status endpoints.',
    },
    {
      label: 'OAuth provider',
      ok: getConfiguredOAuthProviders(env).length > 0,
      hint: 'Set at least one complete Google or Facebook OAuth credential pair.',
    },
  ] satisfies ConfigCheck[];
}

function main() {
  const checks = createChecks();
  const failed = checks.filter((check) => !check.ok);

  if (failed.length === 0) {
    console.log('Production config check passed.');
    return;
  }

  console.error('Production config check failed.');
  for (const check of failed) {
    console.error(`- ${check.label}: ${check.hint}`);
  }

  process.exitCode = 1;
}

main();
