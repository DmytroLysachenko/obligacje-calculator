import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const deploymentDoc = 'docs/technical/architecture/24_deployment_and_devops.md';

function readDoc() {
  return readFileSync(join(root, deploymentDoc), 'utf8');
}

describe('deployment documentation contract', () => {
  it('documents the production migration order for portfolio auth and sync history', () => {
    const source = readDoc();

    expect(source).toContain('0000_unified_schema.sql');
    expect(source).toContain('0001_sync_runs.sql');
    expect(source).toContain('0002_auth_tables.sql');
    expect(source).toContain('Do not deploy portfolio-auth changes until `0002_auth_tables.sql` is applied.');
    expect(source).toContain('Auth.js cannot persist OAuth users, accounts, sessions, or');
  });

  it('documents required OAuth and runtime environment variables', () => {
    const source = readDoc();

    for (const variable of [
      'DATABASE_URL',
      'AUTH_SECRET',
      'NEXTAUTH_SECRET',
      'AUTH_GOOGLE_ID',
      'AUTH_GOOGLE_SECRET',
      'AUTH_FACEBOOK_ID',
      'AUTH_FACEBOOK_SECRET',
      'SYNC_SECRET',
    ]) {
      expect(source).toContain(variable);
    }

    expect(source).toContain('At least one OAuth provider pair must be configured');
    expect(source).toContain('login surface is intentionally OAuth-only');
  });

  it('documents smoke checks for sync status and authenticated portfolio access', () => {
    const source = readDoc();

    expect(source).toContain('Verify `/login` shows the configured OAuth providers.');
    expect(source).toContain('Verify `/api/portfolio/access` reports `canManageWorkspace: true` after sign-in.');
    expect(source).toContain('Verify `/admin/status` shows recent `sync_runs` rows after a manual sync.');
    expect(source).toContain('Verify calculation meta displays both data coverage and last sync attempt');
  });
});
