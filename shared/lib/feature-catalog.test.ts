import { describe, expect, it } from 'vitest';

import {
  getFeaturesForNavigation,
  getFeaturesForPlacement,
  getTrustedReleaseFeatures,
} from './feature-catalog';

describe('feature catalog', () => {
  it('admits only the trusted core and reference routes to release', () => {
    expect(getTrustedReleaseFeatures().map(({ route }) => route)).toEqual([
      '/education',
      '/single-calculator',
      '/economic-data',
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
