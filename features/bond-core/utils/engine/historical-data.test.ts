import { describe, expect, it } from 'vitest';

import { HistoricalDataMap } from '../../types';

import { getHistoricalValue } from './historical-data';

describe('historical market data lookup', () => {
  const marketData: HistoricalDataMap = {
    '2026-03': {
      inflation: 3.2,
      nbpRate: 5.25,
    },
    '2026-04': {
      inflation: 3.1,
      nbpRate: 5,
    },
    '2026-05': {
      inflation: 2.8,
      nbpRate: 4.75,
    },
  };

  it('uses two-month lag for CPI indexed bond resets', () => {
    const result = getHistoricalValue(
      new Date('2026-05-27T00:00:00.000Z'),
      'inflation',
      2,
      marketData,
    );

    expect(result).toEqual({
      value: 3.2,
      isProjected: false,
    });
  });

  it('keeps exact-month NBP lookup for floating-rate bonds', () => {
    const result = getHistoricalValue(
      new Date('2026-05-27T00:00:00.000Z'),
      'nbpRate',
      0,
      marketData,
    );

    expect(result).toEqual({
      value: 4.75,
      isProjected: false,
    });
  });

  it('marks missing CPI months as projected instead of inventing a value', () => {
    const result = getHistoricalValue(
      new Date('2027-05-27T00:00:00.000Z'),
      'inflation',
      2,
      marketData,
    );

    expect(result).toEqual({
      value: undefined,
      isProjected: true,
    });
  });

  it('does not use available current CPI for a lagged future reset', () => {
    const result = getHistoricalValue(
      new Date('2026-07-27T00:00:00.000Z'),
      'inflation',
      2,
      marketData,
    );

    expect(result).toEqual({
      value: 2.8,
      isProjected: false,
    });
  });
});
