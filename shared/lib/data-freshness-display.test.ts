import { describe, expect, it } from 'vitest';

import { CalculationDataFreshness } from '@/features/bond-core/types/scenarios';

import {
  formatFreshnessDate,
  getBondOfferFreshnessState,
  getBondOfferSourceTranslationKey,
  getCalculationFreshnessMetaState,
  getFreshnessCoverageLabel,
  getFreshnessDisplayState,
  getFreshnessLastSyncLabel,
  getFreshnessPrimaryDateLabel,
} from './data-freshness-display';

function freshness(overrides: Partial<CalculationDataFreshness> = {}): CalculationDataFreshness {
  return {
    status: 'stale',
    usedFallback: false,
    ...overrides,
  };
}

describe('data freshness display helpers', () => {
  it('shows official bond-offer provenance without a degraded warning', () => {
    expect(
      getBondOfferFreshnessState(
        freshness({
          bondOfferSource: 'gov.pl',
          bondOfferAttemptAt: '2026-06-15T09:00:00.000Z',
          bondOfferStatus: 'success',
        }),
      ),
    ).toEqual({
      source: 'gov.pl',
      attemptLabel: '2026-06-15',
      status: 'success',
      isDegraded: false,
    });
  });

  it('marks secondary, fallback, failed, and missing offer evidence as degraded', () => {
    for (const freshnessData of [
      freshness({ bondOfferSource: 'obligacjeskarbowe.pl', bondOfferStatus: 'partial' }),
      freshness({ bondOfferSource: 'curated-fallback', bondOfferStatus: 'partial' }),
      freshness({ bondOfferSource: 'gov.pl', bondOfferStatus: 'failed' }),
      freshness(),
    ]) {
      expect(getBondOfferFreshnessState(freshnessData).isDegraded).toBe(true);
    }
  });

  it('maps external offer source IDs to i18n-safe keys', () => {
    expect(getBondOfferSourceTranslationKey('gov.pl')).toBe('gov_pl');
    expect(getBondOfferSourceTranslationKey('obligacjeskarbowe.pl')).toBe('obligacjeskarbowe_pl');
    expect(getBondOfferSourceTranslationKey('curated-fallback')).toBe('curated-fallback');
    expect(getBondOfferSourceTranslationKey('unexpected-source')).toBe('unavailable');
  });

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

  it('builds calculation metadata display state from one freshness envelope', () => {
    expect(
      getCalculationFreshnessMetaState(
        freshness({
          status: 'fresh',
          coverageAsOf: '2026-05',
          lastSyncedAt: '2026-06-20T12:00:00.000Z',
        }),
      ),
    ).toMatchObject({
      status: 'fresh',
      isFresh: true,
      coverageLabel: '2026-05',
      lastSyncLabel: '2026-06-20',
      usedFallback: false,
      toneClass: 'border-[var(--finance-success)] text-foreground',
      dotClass: 'bg-[var(--finance-success)]',
    });

    expect(
      getCalculationFreshnessMetaState(
        freshness({
          status: 'fallback',
          usedFallback: true,
          asOf: 'fallback-reference',
        }),
      ),
    ).toMatchObject({
      status: 'fallback',
      isFresh: false,
      coverageLabel: 'fallback-reference',
      lastSyncLabel: null,
      usedFallback: true,
      toneClass: 'border-[var(--finance-warning)] text-foreground',
      dotClass: 'bg-[var(--finance-warning)]',
    });
  });
});
