import { describe, expect, it } from 'vitest';

import {
  getAuthSecret,
  getConfiguredOAuthProviders,
  getDatabaseUrl,
  getPublicAppUrl,
  getSyncSecret,
  hasAuthSecret,
  hasOAuthProvider,
  isProductionRuntime,
} from './env';

describe('runtime env helpers', () => {
  it('resolves core production runtime values', () => {
    const env = {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://example',
      AUTH_SECRET: 'auth',
      SYNC_SECRET: 'sync',
      NEXT_PUBLIC_APP_URL: 'https://example.com',
    };

    expect(isProductionRuntime(env)).toBe(true);
    expect(getDatabaseUrl(env)).toBe('postgres://example');
    expect(getAuthSecret(env)).toBe('auth');
    expect(getSyncSecret(env)).toBe('sync');
    expect(getPublicAppUrl(env)).toBe('https://example.com');
  });

  it('keeps NEXTAUTH_SECRET as an auth secret compatibility fallback', () => {
    expect(getAuthSecret({ NEXTAUTH_SECRET: 'legacy' })).toBe('legacy');
    expect(hasAuthSecret({ NEXTAUTH_SECRET: 'legacy' })).toBe(true);
  });

  it('detects configured OAuth providers only from complete id and secret pairs', () => {
    expect(
      getConfiguredOAuthProviders({
        AUTH_GOOGLE_ID: 'google-id',
        AUTH_GOOGLE_SECRET: 'google-secret',
        AUTH_FACEBOOK_ID: 'facebook-id',
      }),
    ).toEqual(['google']);
    expect(
      hasOAuthProvider({
        AUTH_FACEBOOK_ID: 'facebook-id',
        AUTH_FACEBOOK_SECRET: 'facebook-secret',
      }),
    ).toBe(true);
    expect(hasOAuthProvider({ AUTH_GOOGLE_ID: 'google-id' })).toBe(false);
  });
});
