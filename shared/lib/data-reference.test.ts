import { describe, expect, it } from 'vitest';
import {
  getReferenceAsOfLabel,
  getReferenceCoverageLabel,
  getReferenceMetaItems,
  getReferenceScopeLabel,
  getReferenceSourceLabel,
  getReferenceState,
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

    expect(getReferenceSourceLabel(meta, 'pl')).toBe('static fallback dataset');
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
    };

    expect(getReferenceSourceLabel(meta, 'en')).toBe('Synced dataset');
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
      { label: 'Coverage', value: 'Coverage not available' },
      { label: 'Use', value: 'Scope unknown' },
    ]);
  });
});
