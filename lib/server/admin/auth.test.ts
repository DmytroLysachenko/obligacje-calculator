import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  assertAdminSyncAuthorization,
  assertAdminSyncAuthorizationForEnv,
  authorizeServiceAdminRequest,
  authorizeSessionAdmin,
} from './auth';

const strongSecret = 'a-strong-secret-with-at-least-24-chars';

describe('admin authorization', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSyncSecret = process.env.SYNC_SECRET;

  afterEach(() => {
    vi.stubEnv('NODE_ENV', originalNodeEnv ?? '');
    if (originalSyncSecret === undefined) delete process.env.SYNC_SECRET;
    else vi.stubEnv('SYNC_SECRET', originalSyncSecret);
    vi.restoreAllMocks();
  });

  it('does not grant an implicit development bypass to machine callers', () => {
    expect(() =>
      assertAdminSyncAuthorizationForEnv(null, {
        NODE_ENV: 'development',
        SYNC_SECRET: strongSecret,
      }),
    ).toThrow('UNAUTHORIZED_SYNC_REQUEST');
  });

  it('accepts only a correctly configured production service token', () => {
    expect(() =>
      assertAdminSyncAuthorizationForEnv(`Bearer ${strongSecret}`, {
        NODE_ENV: 'production',
        SYNC_SECRET: strongSecret,
      }),
    ).not.toThrow();
    expect(() =>
      assertAdminSyncAuthorizationForEnv('Bearer wrong-secret', {
        NODE_ENV: 'production',
        SYNC_SECRET: strongSecret,
      }),
    ).toThrow('UNAUTHORIZED_SYNC_REQUEST');
  });

  it('fails closed for missing, blank, short, prefix, and undefined service credentials', () => {
    for (const SYNC_SECRET of [undefined, '', '   ', 'short']) {
      expect(
        authorizeServiceAdminRequest('Bearer undefined', { NODE_ENV: 'production', SYNC_SECRET }),
      ).toEqual({
        authorized: false,
        reason: 'missing-configuration',
      });
    }
    expect(
      authorizeServiceAdminRequest(`Bearer ${strongSecret}x`, { SYNC_SECRET: strongSecret }),
    ).toEqual({
      authorized: false,
      reason: 'unauthorized',
    });
  });

  it('requires an explicit, case-normalized browser administrator allowlist', () => {
    expect(authorizeSessionAdmin('admin@example.com', { NODE_ENV: 'production' })).toEqual({
      authorized: false,
      reason: 'missing-configuration',
    });
    expect(
      authorizeSessionAdmin('ADMIN@example.com', { ADMIN_EMAIL_ALLOWLIST: 'admin@example.com' }),
    ).toEqual({ authorized: true, method: 'session' });
    expect(
      authorizeSessionAdmin('member@example.com', { ADMIN_EMAIL_ALLOWLIST: 'admin@example.com' }),
    ).toEqual({ authorized: false, reason: 'unauthorized' });
  });

  it('reads the production environment through the public helper', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SYNC_SECRET', strongSecret);
    expect(() => assertAdminSyncAuthorization(`Bearer ${strongSecret}`)).not.toThrow();
  });
});
