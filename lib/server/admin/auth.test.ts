import {afterEach, describe, expect, it, vi} from 'vitest';
import {assertAdminSyncAuthorization} from './auth';

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
