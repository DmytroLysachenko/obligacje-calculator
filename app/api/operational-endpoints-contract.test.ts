import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), 'utf8');
}

describe('operational endpoint contracts', () => {
  it('keeps admin status and sync routes thin and delegated to admin services', () => {
    const statusRoute = read('app/api/admin/status/route.ts');
    const syncRoute = read('app/api/admin/sync/route.ts');

    expect(statusRoute).toContain("from '@/lib/server/admin/service'");
    expect(statusRoute).toContain('getAdminStatusSnapshot');
    expect(statusRoute).toContain('assertAdminSyncAuthorization');
    expect(statusRoute).toContain('okJson(statusSnapshot)');
    expect(statusRoute).not.toContain('db.query');

    expect(syncRoute).toContain('createAdminSyncCommand');
    expect(syncRoute).toContain('createAdminSyncSuccessEnvelope');
    expect(syncRoute).toContain('getAdminSyncEndpointInfo');
    expect(syncRoute).toContain('readOptionalJsonBody');
    expect(syncRoute).not.toContain('z.object');
  });

  it('keeps readiness checks in the server readiness service', () => {
    const route = read('app/api/readiness/route.ts');
    const service = read('lib/server/readiness/service.ts');

    expect(route).toContain("from '@/lib/server/readiness/service'");
    expect(route).toContain('getReadinessSnapshot');
    expect(route).not.toContain('postgres(');
    expect(route).not.toContain('DATABASE_URL');

    expect(service).toContain('REQUIRED_READINESS_TABLES');
    expect(service).toContain('DATABASE_URL');
    expect(service).toContain('AUTH_SECRET');
    expect(service).toContain('SYNC_SECRET');
    expect(service).toContain('Missing required tables');
  });

  it('keeps liveness and readiness as explicit operational endpoints', () => {
    const health = read('app/api/health/route.ts');
    const healthService = read('lib/server/health/service.ts');
    const readiness = read('app/api/readiness/route.ts');

    expect(health).toContain('createHealthPayload');
    expect(health).toContain('rawJson');
    expect(health).not.toContain('NextResponse.json');
    expect(healthService).toContain('MODEL_VERSION');
    expect(healthService).toContain('obligacje-calculator');
    expect(readiness).toContain('snapshot.ok ? 200 : 503');
    expect(`${health}\n${readiness}`).not.toContain('String(error)');
  });

  it('keeps opportunistic sync fire-and-forget logic in the sync service boundary', () => {
    const route = read('app/api/sync/opportunistic/route.ts');
    const service = read('lib/server/sync/opportunistic-service.ts');

    expect(route).toContain("from '@/lib/server/sync/opportunistic-service'");
    expect(route).toContain('getOpportunisticSyncStatus');
    expect(route).toContain('triggerOpportunisticSync');
    expect(route).toContain("cookies.set('last_sync_check'");
    expect(service).toContain('OPPORTUNISTIC_SYNC_COOLDOWN_HOURS');
    expect(service).toContain('createDefaultSyncEngine');
  });
});
