import { describe, expect, it } from 'vitest';
import { createAdminSeriesStatus, createAdminStatusSnapshot } from './status-read-model';

const series = {
  id: 'series-1',
  name: 'Inflation',
  slug: 'pl-cpi',
  frequency: 'monthly',
  lastDataPointDate: null,
  updatedAt: new Date('2026-06-01T00:00:00.000Z'),
  lastSyncStatus: 'success',
  lastSyncError: null,
};

describe('admin status read model', () => {
  it('uses data-point stats when series metadata has no last data point', () => {
    expect(
      createAdminSeriesStatus(series, [
        {
          seriesId: 'series-1',
          totalPoints: '42',
          latestDate: '2026-05-01',
        },
      ]),
    ).toMatchObject({
      id: 'series-1',
      pointCount: 42,
      lastDataPointDate: '2026-05-01',
    });
  });

  it('keeps explicit series metadata date ahead of aggregate stats', () => {
    expect(
      createAdminSeriesStatus(
        {
          ...series,
          lastDataPointDate: '2026-06-01',
        },
        [
          {
            seriesId: 'series-1',
            totalPoints: 12,
            latestDate: '2026-05-01',
          },
        ],
      ),
    ).toMatchObject({
      pointCount: 12,
      lastDataPointDate: '2026-06-01',
    });
  });

  it('defaults point count and date when no aggregate stats exist', () => {
    expect(createAdminSeriesStatus(series, [])).toMatchObject({
      pointCount: 0,
      lastDataPointDate: null,
    });
  });

  it('creates a full snapshot with sync runs and environment fallback', () => {
    const snapshot = createAdminStatusSnapshot({
      series: [series],
      pointStats: [{ seriesId: 'series-1', totalPoints: '7', latestDate: '2026-05-01' }],
      recentSyncRuns: [{ id: 'sync-1', status: 'success' }],
      systemTime: '2026-06-15T12:00:00.000Z',
    });

    expect(snapshot).toEqual({
      series: [
        {
          ...series,
          pointCount: 7,
          lastDataPointDate: '2026-05-01',
        },
      ],
      systemTime: '2026-06-15T12:00:00.000Z',
      env: 'unknown',
      recentSyncRuns: [{ id: 'sync-1', status: 'success' }],
    });
  });
});
