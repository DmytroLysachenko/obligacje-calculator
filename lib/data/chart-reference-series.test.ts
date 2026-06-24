import { describe, expect, it } from 'vitest';
import {
  createInflationSeriesEnvelope,
  createNbpSeriesEnvelope,
  expandMonthlyStepSeries,
  getFallbackInflationSeries,
  getFallbackNbpSeries,
} from './chart-reference-series';

describe('chart reference series helpers', () => {
  it('expands sparse step series month by month', () => {
    expect(
      expandMonthlyStepSeries([
        { date: '2026-01', rate: 3 },
        { date: '2026-04', rate: 4 },
      ]),
    ).toEqual([
      { date: '2026-01', rate: 3 },
      { date: '2026-02', rate: 3 },
      { date: '2026-03', rate: 3 },
      { date: '2026-04', rate: 4 },
    ]);
  });

  it('creates stable fallback CPI and NBP envelopes', () => {
    expect(getFallbackInflationSeries()).toMatchObject({
      source: 'fallback',
      usedFallback: true,
      syncStatus: 'failed',
      coverageNote: 'cpi-fallback-reference',
      coverageStart: '2015-01',
      coverageEnd: '2025-01',
    });
    expect(getFallbackNbpSeries()).toMatchObject({
      source: 'fallback',
      usedFallback: true,
      syncStatus: 'failed',
      coverageNote: 'nbp-fallback-reference',
    });
    expect(getFallbackNbpSeries().coverageStart).toMatch(/^\d{4}-\d{2}$/);
    expect(getFallbackNbpSeries().coverageEnd).toMatch(/^\d{4}-\d{2}$/);
  });

  it('marks stale CPI coverage as fallback-assisted database data', () => {
    const envelope = createInflationSeriesEnvelope({
      data: [{ date: '2026-01', rate: 3.2 }],
      latestPointDate: '2026-01-01',
      lastSyncStatus: 'success',
      metadata: { seriesName: 'CPI' },
      now: new Date('2026-06-15T00:00:00.000Z'),
    });

    expect(envelope).toMatchObject({
      source: 'database',
      usedFallback: true,
      syncStatus: 'stale',
      coverageNote: 'cpi-stale-coverage',
      coverageStart: '2026-01',
      coverageEnd: '2026-01',
    });
  });

  it('keeps fresh CPI coverage as synced context', () => {
    expect(
      createInflationSeriesEnvelope({
        data: [{ date: '2026-05', rate: 3.2 }],
        latestPointDate: '2026-05-01',
        lastSyncStatus: 'success',
        metadata: { seriesName: 'CPI' },
        now: new Date('2026-06-15T00:00:00.000Z'),
      }),
    ).toMatchObject({
      usedFallback: false,
      syncStatus: 'success',
      coverageNote: 'reference-synced-context',
    });
  });

  it('merges sparse NBP coverage with fallback history', () => {
    const envelope = createNbpSeriesEnvelope({
      data: [{ date: '2026-05', rate: 3.75 }],
      lastSyncStatus: 'success',
      metadata: { seriesName: 'NBP' },
    });

    expect(envelope.usedFallback).toBe(true);
    expect(envelope.syncStatus).toBe('partial');
    expect(envelope.coverageNote).toBe('nbp-partial-reference');
    expect(envelope.data.some((point) => point.date === '2026-05' && point.rate === 3.75)).toBe(
      true,
    );
  });
});
