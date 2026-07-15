import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();
const deploymentDoc = 'docs/technical/architecture/24_deployment_and_devops.md';
const docsIndex = 'docs/index.md';
const ciWorkflow = '.github/workflows/ci.yml';
const deployWorkflow = '.github/workflows/deploy-cloud-run.yml';
const rollbackWorkflow = '.github/workflows/rollback-cloud-run.yml';

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
    expect(source).toContain('pnpm check:local-env');
    expect(source).toContain('--expected-revision');
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
    expect(projectMap).toContain('shared/lib/client-logger.ts');
    expect(projectMap).toContain('pnpm scan:unused');
    expect(projectMap).toContain('comparison-results-chart-model.ts');
    expect(projectMap).toContain('single-bond-terminal.ts');
    expect(projectMap).toContain('regular-investment-orchestration.ts');
    expect(projectMap).toContain('OptimizerInputPanel.tsx');
    expect(projectMap).toContain('EconomicDashboardSections.tsx');
    expect(projectMap).toContain('comparison-results-panel-model.ts');
  });

  it('keeps Cloud Run deploy and rollback workflows guarded', () => {
    const deploy = readFileSync(join(root, deployWorkflow), 'utf8');
    const rollback = readFileSync(join(root, rollbackWorkflow), 'utf8');

    expect(deploy).toContain('workflow_dispatch');
    expect(deploy).toContain('refs/heads/main');
    expect(deploy).toContain('production-cloud-run');
    expect(deploy).toContain('--no-allow-unauthenticated');
    expect(deploy).toContain('Validate runtime secrets');
    expect(deploy).toContain('Apply reviewed database migrations');
    expect(deploy).toContain('pnpm exec drizzle-kit migrate');
    expect(deploy).toContain('Release gate');
    expect(deploy).toContain('pnpm check:release');
    expect(deploy).toContain('DATABASE_URL');
    expect(deploy).toContain('AUTH_SECRET');
    expect(deploy).toContain('SYNC_SECRET');
    expect(deploy).toContain('pnpm ops:verify-prod');
    expect(deploy).toContain('--expected-image');
    expect(deploy).toContain('--expected-revision');
    expect(deploy).toContain('Capture deployed revision');
    expect(deploy).toContain('managed-by=github-actions');
    expect(deploy).toContain('--allow-missing-oauth');
    expect(deploy).toContain('docker buildx build');
    expect(deploy).toContain('type=gha');

    expect(rollback).toContain('workflow_dispatch');
    expect(rollback).toContain('production-cloud-run');
    expect(rollback).toContain('gcloud run services update-traffic');
    expect(rollback).toContain('--to-revisions');
    expect(rollback).toContain('pnpm ops:verify-prod');
    expect(rollback).toContain('--expected-revision');
  });

  it('keeps CI wired to release, browser, and performance gates', () => {
    const ci = readFileSync(join(root, ciWorkflow), 'utf8');

    expect(ci).toContain('pnpm test:release');
    expect(ci).toContain('docker-build');
    expect(ci).toContain('docker/build-push-action');
    expect(ci).toContain(
      'pnpm smoke:local -- --base-url http://127.0.0.1:8080 --check-content-type',
    );
    expect(ci).toContain('browser-smoke');
    expect(ci).toContain('Browser environment preflight');
    expect(ci).toContain('pnpm check:local-env -- --require-playwright');
    expect(ci).toContain('pnpm test:browser:ci');
    expect(ci).toContain('actions/upload-artifact');
    expect(ci).toContain('dependency-security');
    expect(ci).toContain('pnpm audit --prod --audit-level=high');
  });

  it('keeps local container workflow discoverable and no-secret by default', () => {
    const compose = readFileSync(join(root, 'compose.yaml'), 'utf8');
    const taskfile = readFileSync(join(root, 'Taskfile.yml'), 'utf8');
    const envExample = readFileSync(join(root, '.env.example'), 'utf8');

    expect(compose).toContain('postgres:17-alpine');
    expect(compose).toContain('postgresql://obligacje:obligacje@postgres:5432/obligacje');
    expect(taskfile).toContain('dev:container');
    expect(taskfile).toContain('preflight');
    expect(taskfile).toContain('prod:container');
    expect(taskfile).toContain('smoke:container');
    expect(taskfile).toContain('smoke:prod-container');
    expect(taskfile).toContain('db:reset-local');
    expect(envExample).toContain('postgresql://obligacje:obligacje@localhost:5432/obligacje');
    expect(envExample).toContain('AUTH_GOOGLE_ID=');
  });

  it('keeps Cloud Build aligned with private Cloud Run preview policy', () => {
    const cloudBuild = readFileSync(join(root, 'cloudbuild.yaml'), 'utf8');
    const cloudBuildLines = cloudBuild.split(/\r?\n/).map((line) => line.trim());

    expect(cloudBuild).toContain('--no-allow-unauthenticated');
    expect(cloudBuild).toContain('pnpm check:release');
    expect(cloudBuild).toContain('--execution-environment');
    expect(cloudBuild).toContain('gen2');
    expect(cloudBuild).toContain('managed-by=cloud-build');
    expect(cloudBuildLines).not.toContain('- --allow-unauthenticated');
  });

  it('keeps Docker build context free of local artifacts and secrets', () => {
    const dockerignore = readFileSync(join(root, '.dockerignore'), 'utf8');

    for (const ignored of [
      '.git',
      '.next',
      '.vercel',
      '.turbo',
      'node_modules',
      '.env',
      '.env.*',
      'coverage',
      'test-results',
    ]) {
      expect(dockerignore).toContain(ignored);
    }

    expect(dockerignore).toContain('!.env.example');
  });
});
