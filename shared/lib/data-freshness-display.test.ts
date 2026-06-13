import { describe, expect, it } from 'vitest';
import {
  formatFreshnessDate,
  getFreshnessCoverageLabel,
  getFreshnessDisplayState,
  getFreshnessLastSyncLabel,
  getFreshnessPrimaryDateLabel,
} from './data-freshness-display';
import { CalculationDataFreshness } from '@/features/bond-core/types/scenarios';

function freshness(
  overrides: Partial<CalculationDataFreshness> = {},
): CalculationDataFreshness {
  return {
    status: 'stale',
    usedFallback: false,
    ...overrides,
  };
}

describe('data freshness display helpers', () => {
  it('keeps coverage date separate from last sync date', () => {
    const state = freshness({
      asOf: '2026-03',
      coverageAsOf: '2026-04',
      lastSyncedAt: '2026-06-13T08:30:00.000Z',
      lastCheck: '2026-05-01T00:00:00.000Z',
    });

    expect(getFreshnessCoverageLabel(state)).toBe('2026-04');
    expect(getFreshnessLastSyncLabel(state)).toBe('2026-06-13');
    expect(getFreshnessPrimaryDateLabel(state, 'No date')).toBe('2026-04');
  });

  it('keeps backward compatibility with older freshness envelopes', () => {
    const state = freshness({
      asOf: '2026-03',
      lastCheck: '2026-06-12T11:15:00.000Z',
    });

    expect(getFreshnessCoverageLabel(state)).toBe('2026-03');
    expect(getFreshnessLastSyncLabel(state)).toBe('2026-06-12');
  });

  it('returns a stable fallback when no freshness metadata exists', () => {
    expect(getFreshnessCoverageLabel(undefined)).toBeNull();
    expect(getFreshnessLastSyncLabel(undefined)).toBeNull();
    expect(getFreshnessPrimaryDateLabel(undefined, 'Unavailable')).toBe('Unavailable');
    expect(getFreshnessDisplayState(undefined, 'Unavailable')).toEqual({
      coverageLabel: 'Unavailable',
      lastSyncLabel: null,
    });
  });

  it('leaves non-date labels readable instead of forcing invalid dates', () => {
    expect(formatFreshnessDate('2026-04')).toBe('2026-04');
    expect(formatFreshnessDate('manual-sync')).toBe('manual-sync');
    expect(formatFreshnessDate(undefined)).toBeNull();
  });
});
