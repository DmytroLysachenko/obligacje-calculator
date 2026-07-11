import 'dotenv/config';

import { pathToFileURL } from 'node:url';

import {
  getAuthSecret,
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

export interface ProductionConfigOptions {
  allowMissingOauth: boolean;
}

export function parseOptions(argv: string[]): ProductionConfigOptions {
  return {
    allowMissingOauth:
      argv.includes('--allow-missing-oauth') || process.env.ALLOW_MISSING_OAUTH === 'true',
  };
}

function isValidPublicUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.hostname === 'localhost';
  } catch {
    return false;
  }
}

function isProductionLike(env = readRuntimeEnv()) {
  const appUrl = getPublicAppUrl(env);
  return env.NODE_ENV === 'production' || Boolean(appUrl?.startsWith('https://'));
}

function isStrongSecret(value: string | undefined, env = readRuntimeEnv()) {
  if (!value) {
    return false;
  }

  if (!isProductionLike(env)) {
    return true;
  }

  return value.length >= 24 && !value.includes('local-development');
}

export function createChecks(options: ProductionConfigOptions = parseOptions([])) {
  const env = readRuntimeEnv();
  const oauthProviders = getConfiguredOAuthProviders(env);

  return [
    {
      label: 'DATABASE_URL',
      ok: Boolean(getDatabaseUrl(env)),
      hint: 'Set the production Postgres connection string.',
    },
    {
      label: 'AUTH_SECRET',
      ok: hasAuthSecret(env) && isStrongSecret(getAuthSecret(env), env),
      hint: 'Set a production-strength AUTH_SECRET, or NEXTAUTH_SECRET while migrating legacy config.',
    },
    {
      label: 'NEXT_PUBLIC_APP_URL',
      ok: isValidPublicUrl(getPublicAppUrl(env)),
      hint: 'Set a valid canonical deployed URL used by metadata and shared links.',
    },
    {
      label: 'SYNC_SECRET',
      ok: isStrongSecret(getSyncSecret(env), env),
      hint: 'Set a production-strength secret used by admin sync/status endpoints.',
    },
    {
      label: 'OAuth provider',
      ok: options.allowMissingOauth || oauthProviders.length > 0,
      hint: options.allowMissingOauth
        ? 'OAuth provider is temporarily allowed to be missing for private preview.'
        : 'Set at least one complete Google or Facebook OAuth credential pair.',
    },
  ] satisfies ConfigCheck[];
}

export function main(argv = process.argv.slice(2)) {
  const checks = createChecks(parseOptions(argv));
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
