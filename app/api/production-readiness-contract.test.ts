import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), 'utf8');
}

describe('production readiness contract', () => {
  it('keeps Cloud Run container artifacts checked in', () => {
    expect(read('Dockerfile')).toContain('EXPOSE 8080');
    expect(read('Dockerfile')).toContain('CMD ["node", "server.js"]');
    expect(read('cloudbuild.yaml')).toContain('gcloud');
    expect(read('cloudbuild.yaml')).toContain('run');
    expect(read('cloudbuild.yaml')).toContain('--port');
    expect(read('next.config.ts')).toContain("output: 'standalone'");
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
});
