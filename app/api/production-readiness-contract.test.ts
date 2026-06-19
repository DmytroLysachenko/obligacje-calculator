import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), 'utf8');
}

describe('production readiness contract', () => {
  it('keeps Cloud Run container artifacts checked in', () => {
    const dockerfile = read('Dockerfile');
    const cloudbuild = read('cloudbuild.yaml');

    expect(dockerfile).toContain('FROM node:24-bookworm-slim AS base');
    expect(dockerfile).toContain('ENV NODE_ENV=production');
    expect(dockerfile).toContain('ENV HOSTNAME=0.0.0.0');
    expect(dockerfile).toContain('COPY --from=builder /app/.next/standalone ./');
    expect(dockerfile).toContain('COPY --from=builder /app/.next/static ./.next/static');
    expect(dockerfile).toContain('EXPOSE 8080');
    expect(dockerfile).toContain('CMD ["node", "server.js"]');
    expect(cloudbuild).toContain('gcr.io/cloud-builders/docker');
    expect(cloudbuild).toContain('gcr.io/google.com/cloudsdktool/cloud-sdk');
    expect(cloudbuild).toContain('run');
    expect(cloudbuild).toContain('deploy');
    expect(cloudbuild).toContain('--port');
    expect(cloudbuild).toContain('"8080"');
    expect(read('next.config.ts')).toContain("output: 'standalone'");
  });

  it('keeps Cloud Build deploy substitutions and image tags stable', () => {
    const cloudbuild = read('cloudbuild.yaml');

    for (const substitution of [
      '_REGION: europe-central2',
      '_SERVICE: obligacje-calculator',
      '_AR_REPOSITORY: obligacje-calculator',
    ]) {
      expect(cloudbuild).toContain(substitution);
    }

    expect(cloudbuild).toContain('${_REGION}-docker.pkg.dev/$PROJECT_ID/${_AR_REPOSITORY}/${_SERVICE}:$SHORT_SHA');
    expect(cloudbuild).toContain('${_REGION}-docker.pkg.dev/$PROJECT_ID/${_AR_REPOSITORY}/${_SERVICE}:latest');
    expect(cloudbuild).toContain('--allow-unauthenticated');
    expect(cloudbuild).toContain('--platform');
    expect(cloudbuild).toContain('managed');
  });

  it('exposes liveness and readiness routes with safe checks', () => {
    const health = read('app/api/health/route.ts');
    const readiness = read('app/api/readiness/route.ts');

    expect(health).toContain('MODEL_VERSION');
    expect(readiness).toContain('DATABASE_URL');
    expect(readiness).toContain('AUTH_SECRET');
    expect(readiness).toContain('SYNC_SECRET');
    expect(readiness).toContain('Missing required tables');
    expect(readiness).not.toContain('String(error)');
  });

  it('keeps the Cloud Run release gate wired into package scripts', () => {
    const packageJson = JSON.parse(read('package.json')) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts['test:release']).toContain('app/api/production-readiness-contract.test.ts');
    expect(packageJson.scripts['check:release']).toBe(
      'pnpm check:types && pnpm lint && pnpm test:release && pnpm build',
    );
  });
});
