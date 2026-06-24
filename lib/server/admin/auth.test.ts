import { afterEach, describe, expect, it, vi } from 'vitest';

import { assertAdminSyncAuthorization, assertAdminSyncAuthorizationForEnv } from './auth';

describe('assertAdminSyncAuthorization', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSyncSecret = process.env.SYNC_SECRET;

  afterEach(() => {
    vi.stubEnv('NODE_ENV', originalNodeEnv ?? '');
    if (originalSyncSecret === undefined) {
      delete process.env.SYNC_SECRET;
    } else {
      vi.stubEnv('SYNC_SECRET', originalSyncSecret);
    }
    vi.restoreAllMocks();
  });

  it('allows requests outside production without checking the secret', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('SYNC_SECRET', 'top-secret');

    expect(() => assertAdminSyncAuthorization(null)).not.toThrow();
    expect(() => assertAdminSyncAuthorization('Bearer anything')).not.toThrow();
  });

  it('supports explicit runtime env injection for authorization checks', () => {
    expect(() =>
      assertAdminSyncAuthorizationForEnv(null, {
        NODE_ENV: 'development',
        SYNC_SECRET: 'top-secret',
      }),
    ).not.toThrow();
    expect(() =>
      assertAdminSyncAuthorizationForEnv('Bearer top-secret', {
        NODE_ENV: 'production',
        SYNC_SECRET: 'top-secret',
      }),
    ).not.toThrow();
    expect(() =>
      assertAdminSyncAuthorizationForEnv('Bearer wrong-secret', {
        NODE_ENV: 'production',
        SYNC_SECRET: 'top-secret',
      }),
    ).toThrow('UNAUTHORIZED_SYNC_REQUEST');
  });

  it('allows production requests with the configured bearer token', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SYNC_SECRET', 'top-secret');

    expect(() => assertAdminSyncAuthorization('Bearer top-secret')).not.toThrow();
  });

  it('rejects production requests with a missing or invalid bearer token', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SYNC_SECRET', 'top-secret');

    expect(() => assertAdminSyncAuthorization(null)).toThrow('UNAUTHORIZED_SYNC_REQUEST');
    expect(() => assertAdminSyncAuthorization('Bearer wrong-secret')).toThrow(
      'UNAUTHORIZED_SYNC_REQUEST',
    );
  });
});
