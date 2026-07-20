import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ECONOMIC_VIEW,
  parseEconomicView,
  serializeEconomicView,
} from '../../lib/economic-view';

describe('economic view URL state', () => {
  it('uses stable defaults for invalid parameters', () => {
    expect(parseEconomicView(new URLSearchParams('series=gold&range=2Y&scale=wide'))).toEqual(
      DEFAULT_ECONOMIC_VIEW,
    );
  });

  it('round trips a CPI reading state', () => {
    const view = { series: 'cpi' as const, range: '5Y' as const, scale: 'full' as const };
    expect(parseEconomicView(new URLSearchParams(serializeEconomicView(view)))).toEqual(view);
  });

  it('does not retain CPI scale when NBP is active', () => {
    expect(serializeEconomicView({ series: 'nbp', range: '1Y', scale: 'full' })).toBe(
      'series=nbp&range=1Y',
    );
  });
});
