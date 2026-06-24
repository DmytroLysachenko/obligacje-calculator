import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();
const deploymentDoc = 'docs/technical/architecture/24_deployment_and_devops.md';
const docsIndex = 'docs/index.md';

function readDoc() {
  return readFileSync(join(root, deploymentDoc), 'utf8');
}

describe('deployment documentation contract', () => {
  it('documents Cloud Run as the production deployment target', () => {
    const source = readDoc();

    expect(source).toContain('Google Cloud Run');
    expect(source).toContain('Dockerfile');
    expect(source).toContain('cloudbuild.yaml');
    expect(source).toContain('pnpm check:prod-config');
    expect(source).toContain('europe-central2');
    expect(source).toContain('standalone `server.js`');
    expect(source).toContain('retained-route release scope');
    expect(source).toContain('calculation route helpers');
  });

  it('documents the production migration order for portfolio auth and sync history', () => {
    const source = readDoc();

    expect(source).toContain('0000_unified_schema.sql');
    expect(source).toContain('0001_sync_runs.sql');
    expect(source).toContain('0002_auth_tables.sql');
    expect(source).toContain(
      'Do not deploy portfolio-auth changes until `0002_auth_tables.sql` is applied.',
    );
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
      'NEXT_PUBLIC_APP_URL',
    ]) {
      expect(source).toContain(variable);
    }

    expect(source).toContain('At least one OAuth provider pair must be configured');
    expect(source).toContain('login surface is intentionally OAuth-only');
    expect(source).toContain('validates `DATABASE_URL`, `AUTH_SECRET` or');
    expect(source).toContain('intentionally not part of `check:release`');
  });

  it('documents smoke checks for sync status and authenticated portfolio access', () => {
    const source = readDoc();

    expect(source).toContain('Verify `/api/health` returns `ok: true`.');
    expect(source).toContain('Verify `/api/readiness` returns `ok: true`');
    expect(source).toContain('Verify `/login` shows the configured OAuth providers.');
    expect(source).toContain(
      'Verify `/api/portfolio/access` reports `canManageWorkspace: true` after sign-in.',
    );
    expect(source).toContain(
      'Verify `/admin/status` shows recent `sync_runs` rows after a manual sync',
    );
    expect(source).toContain('lastSyncAttemptAt');
    expect(source).toContain('lastDataPointDate');
    expect(source).toContain(
      'Verify calculation meta displays both data coverage and last sync attempt',
    );
  });

  it('keeps the project map discoverable from the documentation index', () => {
    const source = readFileSync(join(root, docsIndex), 'utf8');
    const projectMap = readFileSync(
      join(root, 'docs/technical/architecture/28_project_map.md'),
      'utf8',
    );

    expect(source).toContain('./technical/architecture/28_project_map.md');
    expect(projectMap).toContain('Browser API calls belong behind `shared/lib/*-client.ts`');
    expect(projectMap).toContain('Portfolio writes live in `lib/server/portfolio/commands.ts`');
    expect(projectMap).toContain(
      'Large components should be reduced by extracting pure models first',
    );
    expect(projectMap).toContain('lib/server/runtime/env.ts');
    expect(projectMap).toContain('lib/server/auth/provider-config.ts');
    expect(projectMap).toContain('scripts/check-production-config.ts');
    expect(projectMap).toContain('lib/server/http/calculation-route.ts');
    expect(projectMap).toContain('lib/server/admin/status-read-model.ts');
    expect(projectMap).toContain('OptimizerInputPanel.tsx');
    expect(projectMap).toContain('EconomicDashboardSections.tsx');
    expect(projectMap).toContain('results-dashboard-model.ts');
  });
});
