import { describe, expect, it } from 'vitest';

import {
  getChartGranularityQueryKey,
  readChartGranularityFromSearchParams,
} from './chart-display-preferences';

describe('chart display preference query state', () => {
  it('uses an independent, readable key for each chart scope', () => {
    expect(getChartGranularityQueryKey()).toBe('chart-step-default');
    expect(getChartGranularityQueryKey('regular-investment')).toBe('chart-step-regular-investment');
  });

  it('reads only available chart intervals from the URL', () => {
    const searchParams = new URLSearchParams('chart-step-regular-investment=quarterly');

    expect(
      readChartGranularityFromSearchParams(
        searchParams,
        ['monthly', 'quarterly', 'yearly'],
        'regular-investment',
      ),
    ).toBe('quarterly');
  });

  it('ignores unsupported or malformed URL values', () => {
    const searchParams = new URLSearchParams('chart-step-comparison=daily');

    expect(
      readChartGranularityFromSearchParams(searchParams, ['monthly', 'yearly'], 'comparison'),
    ).toBeUndefined();
  });
});
