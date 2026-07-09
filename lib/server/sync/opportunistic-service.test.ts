import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getLatestSyncRunForScope: vi.fn(),
}));

vi.mock('@/lib/server/sync/run-history', () => ({
  getLatestSyncRunForScope: mocks.getLatestSyncRunForScope,
}));

vi.mock('@/lib/sync/create-sync-engine', () => ({
  createDefaultSyncEngine: vi.fn(() => ({
    runFullSync: vi.fn(),
  })),
}));

describe('getOpportunisticSyncStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-09T12:00:00.000Z'));
    vi.clearAllMocks();
    mocks.getLatestSyncRunForScope.mockResolvedValue(null);
  });

  it('keeps recent cookie cooldown as the fastest decision', async () => {
    const { getOpportunisticSyncStatus } = await import('./opportunistic-service');

    await expect(getOpportunisticSyncStatus('2026-07-09T08:00:00.000Z')).resolves.toEqual({
      status: 'cooldown',
      lastChecked: '2026-07-09T08:00:00.000Z',
    });
    expect(mocks.getLatestSyncRunForScope).not.toHaveBeenCalled();
  });

  it('uses recent server full-sync history when the client cookie is missing', async () => {
    mocks.getLatestSyncRunForScope.mockResolvedValue({
      scope: 'full-sync',
      startedAt: new Date('2026-07-09T07:59:00.000Z'),
      finishedAt: new Date('2026-07-09T08:00:00.000Z'),
    });
    const { getOpportunisticSyncStatus } = await import('./opportunistic-service');

    await expect(getOpportunisticSyncStatus(undefined)).resolves.toEqual({
      status: 'cooldown',
      lastChecked: '2026-07-09T08:00:00.000Z',
    });
    expect(mocks.getLatestSyncRunForScope).toHaveBeenCalledWith('full-sync');
  });

  it('triggers sync when both client and server cooldown windows are stale', async () => {
    mocks.getLatestSyncRunForScope.mockResolvedValue({
      scope: 'full-sync',
      startedAt: new Date('2026-07-08T08:00:00.000Z'),
      finishedAt: new Date('2026-07-08T08:30:00.000Z'),
    });
    const { getOpportunisticSyncStatus } = await import('./opportunistic-service');

    await expect(getOpportunisticSyncStatus(undefined)).resolves.toEqual({
      status: 'triggered',
    });
  });
});
