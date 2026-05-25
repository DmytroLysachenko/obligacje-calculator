import { describe, expect, it } from 'vitest';
import { enUS } from 'date-fns/locale';
import { buildLadderMaturityBuckets } from './ladder-display';

describe('ladder display helpers', () => {
  it('groups maturity lots into sorted monthly buckets', () => {
    const buckets = buildLadderMaturityBuckets(
      [
        {
          maturityDate: '2036-05-01T00:00:00.000Z',
          netValue: 1200,
        },
        {
          maturityDate: '2036-05-15T00:00:00.000Z',
          netValue: 300,
        },
        {
          maturityDate: '2036-06-01T00:00:00.000Z',
          netValue: 900,
        },
      ] as never,
      enUS,
    );

    expect(buckets).toHaveLength(2);
    expect(buckets[0]).toMatchObject({
      date: '2036-05',
      amount: 1500,
      count: 2,
    });
    expect(buckets[1]).toMatchObject({
      date: '2036-06',
      amount: 900,
      count: 1,
    });
  });
});
