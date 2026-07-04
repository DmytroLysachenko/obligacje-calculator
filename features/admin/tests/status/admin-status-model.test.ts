import { describe, expect, it } from 'vitest';

import type { AdminSeriesStatus, AdminStatusData } from '@/shared/lib/admin-client';

import {
  createAdminSeriesRowModel,
  createAdminStatusViewModel,
  hasSeriesDataGap,
  resolveSeriesHealth,
} from '../../status/lib/admin-status-model';

const now = new Date('2026-06-15T12:00:00.000Z');

function series(overrides: Partial<AdminSeriesStatus> = {}): AdminSeriesStatus {
  return {
    id: 'series-1',
    name: 'Inflation',
    slug: 'pl-cpi',
    frequency: 'monthly',
    lastDataPointDate: '2026-05-01',
    pointCount: 10,
    updatedAt: '2026-06-01T00:00:00.000Z',
    lastSyncStatus: 'success',
    lastSyncError: null,
    ...overrides,
  };
}

describe('admin status model', () => {
  it('detects stale missing and invalid last data point dates as gaps', () => {
    expect(hasSeriesDataGap('2026-05-01', now)).toBe(false);
    expect(hasSeriesDataGap('2026-03-01', now)).toBe(true);
    expect(hasSeriesDataGap(null, now)).toBe(true);
    expect(hasSeriesDataGap('not-a-date', now)).toBe(true);
  });

  it('maps sync statuses to row health states', () => {
    expect(resolveSeriesHealth('success')).toBe('healthy');
    expect(resolveSeriesHealth('failed')).toBe('failed');
    expect(resolveSeriesHealth('partial')).toBe('initial');
    expect(resolveSeriesHealth(null)).toBe('initial');
  });

  it('creates row display state without mutating the source series', () => {
    const source = series({ lastDataPointDate: null, lastSyncStatus: 'failed' });
    const row = createAdminSeriesRowModel(source, now);

    expect(row).toMatchObject({
      id: 'series-1',
      hasDataGap: true,
      isMissingData: true,
      health: 'failed',
    });
    expect(source).not.toHaveProperty('hasDataGap');
  });

  it('creates aggregate metrics and rows for the dashboard', () => {
    const data: AdminStatusData = {
      series: [
        series({ id: 'a', pointCount: 10 }),
        series({ id: 'b', pointCount: 15, lastSyncStatus: 'failed' }),
      ],
      systemTime: '2026-06-15T12:00:00.000Z',
      env: 'production',
    };

    const model = createAdminStatusViewModel(data, now);

    expect(model.metrics).toEqual({
      seriesCount: 2,
      totalDataPoints: 25,
      environment: 'production',
    });
    expect(model.rows.map((row) => row.health)).toEqual(['healthy', 'failed']);
    expect(model.isEmpty).toBe(false);
  });

  it('uses empty defaults when no status data is loaded', () => {
    expect(createAdminStatusViewModel(null, now)).toEqual({
      metrics: {
        seriesCount: 0,
        totalDataPoints: 0,
        environment: 'unknown',
      },
      rows: [],
      isEmpty: true,
    });
  });
});
