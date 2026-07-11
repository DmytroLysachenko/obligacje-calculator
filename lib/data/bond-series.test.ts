import { afterEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/db';

import { getAllBondSeries, getBondSeriesBySymbol } from './bond-series';

vi.mock('@/db', () => ({
  isDatabaseConfigured: true,
  db: {
    query: {
      bondSeries: {
        findMany: vi.fn(),
      },
      polishBonds: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock('@/db/schema', () => ({
  bondSeries: {
    bondTypeId: 'bond_type_id',
    emissionMonth: 'emission_month',
  },
  polishBonds: {
    symbol: 'symbol',
  },
}));

const mockedBondSeriesFindMany = vi.mocked(db.query.bondSeries.findMany);
const mockedPolishBondsFindFirst = vi.mocked(db.query.polishBonds.findFirst);

afterEach(() => {
  vi.clearAllMocks();
});

describe('bond series data access', () => {
  it('falls back to an empty list when all-series lookup fails', async () => {
    mockedBondSeriesFindMany.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(getAllBondSeries()).resolves.toEqual([]);
  });

  it('falls back to an empty list when bond lookup fails', async () => {
    mockedPolishBondsFindFirst.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(getBondSeriesBySymbol('EDO')).resolves.toEqual([]);
  });

  it('returns an empty list when the bond symbol has no configured type', async () => {
    mockedPolishBondsFindFirst.mockResolvedValueOnce(undefined);

    await expect(getBondSeriesBySymbol('EDO')).resolves.toEqual([]);
    expect(mockedBondSeriesFindMany).not.toHaveBeenCalled();
  });
});
