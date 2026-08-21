import { describe, expect, it } from 'vitest';

import { isExpectedCurrentOfferSeriesCode } from './bond-offer-sync-service';

describe('isExpectedCurrentOfferSeriesCode', () => {
  it('rejects a prior-month official series before it can overwrite the active offer', () => {
    expect(
      isExpectedCurrentOfferSeriesCode(
        { symbol: 'ROR', seriesCode: 'ROR0727', source: 'gov.pl' },
        '2026-08-01',
      ),
    ).toBe(false);
  });

  it('accepts the expected active official series', () => {
    expect(
      isExpectedCurrentOfferSeriesCode(
        { symbol: 'ROR', seriesCode: 'ROR0827', source: 'gov.pl' },
        '2026-08-01',
      ),
    ).toBe(true);
  });

  it('keeps curated fallback explicitly available as degraded data', () => {
    expect(
      isExpectedCurrentOfferSeriesCode({ symbol: 'ROR', source: 'curated-fallback' }, '2026-08-01'),
    ).toBe(true);
  });
});
