import { format } from 'date-fns';
import { describe, expect, it } from 'vitest';

import { getSeriesReferenceDate } from './market-data-cache';

describe('market data cache helpers', () => {
  it('uses the latest data point date as the reference date for NBP series', () => {
    const referenceDate = getSeriesReferenceDate({
      slug: 'nbp-ref-rate',
      frequency: 'on-event',
      lastDataPointDate: '2026-05-15',
      updatedAt: new Date('2026-03-26T12:00:00.000Z'),
    });

    expect(referenceDate ? format(referenceDate, 'yyyy-MM-dd') : undefined).toBe('2026-05-15');
  });

  it('falls back to update time only when no data point date exists', () => {
    const referenceDate = getSeriesReferenceDate({
      slug: 'nbp-ref-rate',
      frequency: 'on-event',
      updatedAt: new Date('2026-03-26T12:00:00.000Z'),
    });

    expect(referenceDate?.toISOString()).toBe('2026-03-26T12:00:00.000Z');
  });

  it('uses CPI data point date when both sync time and data time are present', () => {
    const referenceDate = getSeriesReferenceDate({
      slug: 'pl-cpi',
      frequency: 'monthly',
      lastDataPointDate: '2026-04-01',
      updatedAt: new Date('2026-05-31T08:00:00.000Z'),
    });

    expect(referenceDate ? format(referenceDate, 'yyyy-MM-dd') : undefined).toBe('2026-04-01');
  });

  it('keeps sync-only series readable when no datapoint has been recorded', () => {
    const referenceDate = getSeriesReferenceDate({
      slug: 'custom-reference',
      updatedAt: new Date('2026-05-31T08:00:00.000Z'),
    });

    expect(referenceDate?.toISOString()).toBe('2026-05-31T08:00:00.000Z');
  });
});
