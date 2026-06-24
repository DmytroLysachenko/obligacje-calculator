import { describe, expect, it } from 'vitest';
import {
  getReferenceAsOfLabel,
  getReferenceCoverageLabel,
  getReferenceMetaItems,
  getReferenceScopeLabel,
  getReferenceSourceLabel,
  getReferenceState,
  getReferenceStatusKind,
} from './data-reference';

describe('data-reference localization', () => {
  it('returns localized fallback labels for Polish views', () => {
    const meta = {
      source: 'fallback' as const,
      usedFallback: true,
      asOf: '2024-06-01',
      coverageStart: '2021-01',
      coverageEnd: '2025-01',
      dataSource: 'static fallback dataset',
    };

    expect(getReferenceSourceLabel(meta, 'pl')).toBe('Zapasowy zestaw danych');
    expect(getReferenceCoverageLabel(meta, 'pl')).toBe('2021-01 - 2025-01');
    expect(getReferenceAsOfLabel(meta, 'pl')).toBe('2024-06-01');
    expect(getReferenceScopeLabel(meta, 'pl')).toBe('Tylko odczyt referencyjny');

    const state = getReferenceState(meta, 'pl');
    expect(state.title).toBe('Zastepczy lub czesciowy zakres');
    expect(state.description).toContain('wsparcie referencyjne');
  });

  it('returns localized synced labels for English views', () => {
    const meta = {
      source: 'database' as const,
      usedFallback: false,
      asOf: '2024-06',
      coverageStart: '2010-01',
      coverageEnd: '2024-06',
      dataSource: 'NBP official API',
    };

    expect(getReferenceSourceLabel(meta, 'en')).toBe('Official NBP API');
    expect(getReferenceCoverageLabel(meta, 'en')).toBe('2010-01 - 2024-06');
    expect(getReferenceAsOfLabel(meta, 'en')).toBe('2024-06');
    expect(getReferenceScopeLabel(meta, 'en')).toBe('Supports calculator context');

    const state = getReferenceState(meta, 'en');
    expect(state.title).toBe('Synced reference coverage');
    expect(state.description).toContain('calculator interpretation');
  });

  it('builds structured meta items in locale order', () => {
    const meta = {
      source: 'database' as const,
      usedFallback: false,
      asOf: '2024-06',
      coverageStart: '2010-01',
      coverageEnd: '2024-06',
    };

    expect(getReferenceMetaItems(meta, 'pl')).toEqual([
      { label: 'Zrodlo', value: 'Zsynchronizowany zestaw danych' },
      { label: 'Stan na', value: '2024-06' },
      { label: 'Zakres', value: '2010-01 - 2024-06' },
      { label: 'Uzycie', value: 'Wspiera kontekst kalkulatora' },
    ]);

    expect(getReferenceMetaItems(undefined, 'en')).toEqual([
      { label: 'Source', value: 'Unavailable' },
      { label: 'As of', value: 'Unavailable' },
      { label: 'Coverage', value: 'Coverage unavailable' },
      { label: 'Use', value: 'Scope unknown' },
    ]);
  });

  it('uses localized partial and stale descriptions when explicit sync state exists', () => {
    const partialMeta = {
      source: 'database' as const,
      usedFallback: true,
      syncStatus: 'partial' as const,
      coverageNote: 'cpi-partial-reference',
    };

    const staleMeta = {
      source: 'database' as const,
      usedFallback: true,
      syncStatus: 'stale' as const,
      coverageNote: 'cpi-stale-coverage',
    };

    expect(getReferenceState(partialMeta, 'pl').description).toContain(
      'czesciowy zakres referencyjny',
    );
    expect(getReferenceState(staleMeta, 'pl').title).toBe('Zakres wymaga odswiezenia');
    expect(getReferenceState(staleMeta, 'en').description).toContain('too old');
  });

  it('localizes the official GUS archive and fallback CPI labels', () => {
    expect(
      getReferenceSourceLabel({ dataSource: 'GUS official CPI monthly archive CSV' }, 'pl'),
    ).toBe('Oficjalne archiwum CPI GUS');

    expect(
      getReferenceState(
        {
          source: 'fallback',
          usedFallback: true,
          syncStatus: 'failed',
          coverageNote: 'cpi-fallback-reference',
        },
        'en',
      ).description,
    ).toContain('fallback coverage');
  });

  it('maps reference envelopes to one status kind for dashboard labels', () => {
    expect(
      getReferenceStatusKind({
        source: 'database',
        usedFallback: false,
        syncStatus: 'success',
      }),
    ).toBe('synced');
    expect(
      getReferenceStatusKind({
        source: 'database',
        usedFallback: true,
        syncStatus: 'success',
      }),
    ).toBe('fallback');
    expect(
      getReferenceStatusKind({
        source: 'database',
        usedFallback: true,
        syncStatus: 'stale',
      }),
    ).toBe('stale');
    expect(
      getReferenceStatusKind({
        source: 'database',
        usedFallback: true,
        syncStatus: 'partial',
      }),
    ).toBe('partial');
    expect(getReferenceStatusKind(undefined)).toBe('fallback');
  });
});
