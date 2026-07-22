import { describe, expect, it } from 'vitest';

import {
  getFeaturesForNavigation,
  getFeaturesForPlacement,
  getTrustedReleaseFeatures,
} from './feature-catalog';

describe('feature catalog', () => {
  it('orders the trusted core navigation around calculation, context, and learning', () => {
    expect(getTrustedReleaseFeatures().map(({ route }) => route)).toEqual([
      '/single-calculator',
      '/economic-data',
      '/education',
    ]);
  });

  it('keeps conditional calculators together in the private-preview placement', () => {
    expect(getFeaturesForPlacement('preview').map(({ route }) => route)).toEqual([
      '/compare',
      '/regular-investment',
      '/ladder',
      '/notebook',
    ]);
    expect(getFeaturesForNavigation('conditional')).toHaveLength(4);
  });
});
