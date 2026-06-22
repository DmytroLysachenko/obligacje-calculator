import { describe, expect, it } from 'vitest';
import {
  getAuthRuntimeConfig,
  getAuthRuntimeSecret,
  getOAuthProviderCredentials,
} from './provider-config';

describe('auth provider config', () => {
  it('uses configured auth secret ahead of development fallback', () => {
    expect(getAuthRuntimeSecret({
      NODE_ENV: 'development',
      AUTH_SECRET: 'auth-secret',
    })).toBe('auth-secret');
  });

  it('keeps NEXTAUTH_SECRET compatibility and development fallback', () => {
    expect(getAuthRuntimeSecret({
      NODE_ENV: 'production',
      NEXTAUTH_SECRET: 'legacy-secret',
    })).toBe('legacy-secret');
    expect(getAuthRuntimeSecret({ NODE_ENV: 'development' })).toBe('obligacje-calculator-dev-secret');
    expect(getAuthRuntimeSecret({ NODE_ENV: 'production' })).toBeUndefined();
  });

  it('returns provider credentials only for complete configured providers', () => {
    expect(getOAuthProviderCredentials({
      AUTH_GOOGLE_ID: 'google-id',
      AUTH_GOOGLE_SECRET: 'google-secret',
      AUTH_FACEBOOK_ID: 'facebook-id',
    })).toEqual([
      {
        name: 'google',
        clientId: 'google-id',
        clientSecret: 'google-secret',
      },
    ]);
  });

  it('returns both provider credentials in deterministic order', () => {
    expect(getOAuthProviderCredentials({
      AUTH_FACEBOOK_ID: 'facebook-id',
      AUTH_FACEBOOK_SECRET: 'facebook-secret',
      AUTH_GOOGLE_ID: 'google-id',
      AUTH_GOOGLE_SECRET: 'google-secret',
    })).toEqual([
      {
        name: 'google',
        clientId: 'google-id',
        clientSecret: 'google-secret',
      },
      {
        name: 'facebook',
        clientId: 'facebook-id',
        clientSecret: 'facebook-secret',
      },
    ]);
  });

  it('creates the full auth runtime config', () => {
    expect(getAuthRuntimeConfig({
      NODE_ENV: 'production',
      AUTH_SECRET: 'auth-secret',
      AUTH_FACEBOOK_ID: 'facebook-id',
      AUTH_FACEBOOK_SECRET: 'facebook-secret',
    })).toEqual({
      authSecret: 'auth-secret',
      providers: [
        {
          name: 'facebook',
          clientId: 'facebook-id',
          clientSecret: 'facebook-secret',
        },
      ],
    });
  });
});
