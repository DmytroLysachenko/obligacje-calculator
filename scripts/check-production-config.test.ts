import { afterEach, describe, expect, it } from 'vitest';

import { createChecks, parseOptions } from './check-production-config';

const originalEnv = { ...process.env };

function setEnv(values: Partial<NodeJS.ProcessEnv>) {
  process.env = {
    ...originalEnv,
    ...values,
  };
}

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('production config check', () => {
  it('accepts explicit missing OAuth allowance for private preview', () => {
    setEnv({
      DATABASE_URL: 'postgresql://user:pass@db.example.com:5432/app',
      AUTH_SECRET: 'production-auth-secret-value',
      SYNC_SECRET: 'production-sync-secret-value',
      NEXT_PUBLIC_APP_URL: 'https://app.example.com',
      AUTH_GOOGLE_ID: '',
      AUTH_GOOGLE_SECRET: '',
    });

    expect(parseOptions(['--allow-missing-oauth'])).toEqual({ allowMissingOauth: true });
    expect(createChecks({ allowMissingOauth: true }).filter((check) => !check.ok)).toEqual([]);
  });

  it('requires OAuth by default when no temporary exception is supplied', () => {
    setEnv({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:pass@db.example.com:5432/app',
      AUTH_SECRET: 'production-auth-secret-value',
      SYNC_SECRET: 'production-sync-secret-value',
      NEXT_PUBLIC_APP_URL: 'https://app.example.com',
      AUTH_GOOGLE_ID: '',
      AUTH_GOOGLE_SECRET: '',
    });

    expect(createChecks({ allowMissingOauth: false }).filter((check) => !check.ok)).toEqual([
      expect.objectContaining({ label: 'OAuth provider' }),
    ]);
  });

  it('rejects weak production-like secrets and invalid public URLs', () => {
    setEnv({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:pass@db.example.com:5432/app',
      AUTH_SECRET: 'local-development-auth-secret-change-me',
      SYNC_SECRET: 'short',
      NEXT_PUBLIC_APP_URL: 'ftp://app.example.com',
      AUTH_GOOGLE_ID: 'google-id',
      AUTH_GOOGLE_SECRET: 'google-secret',
    });

    const failedLabels = createChecks({ allowMissingOauth: false })
      .filter((check) => !check.ok)
      .map((check) => check.label);

    expect(failedLabels).toEqual(['AUTH_SECRET', 'NEXT_PUBLIC_APP_URL', 'SYNC_SECRET']);
  });
});
