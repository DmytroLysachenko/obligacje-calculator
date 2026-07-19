import { describe, expect, it } from 'vitest';

import { ADMITTED_PREVIEW_SMOKE_CHECKS, parseArgs } from './verify-production';

describe('production verification options', () => {
  it('limits admitted-preview smoke routes to education, single calculator, and economic data', () => {
    expect(ADMITTED_PREVIEW_SMOKE_CHECKS.map((check) => check.path)).toEqual([
      '/api/health',
      '/education',
      '/single-calculator',
      '/economic-data',
      '/api/calculation-defaults',
      '/login',
    ]);
  });

  it('accepts explicit Cloud Run image and revision expectations', () => {
    expect(
      parseArgs([
        '--base-url',
        'https://app.example.com/',
        '--allow-missing-oauth',
        '--expected-image',
        'europe-central2-docker.pkg.dev/project/repo/app:sha',
        '--expected-revision',
        'obligacje-calculator-00042-abc',
      ]),
    ).toMatchObject({
      baseUrl: 'https://app.example.com',
      allowMissingOauth: true,
      expectedImage: 'europe-central2-docker.pkg.dev/project/repo/app:sha',
      expectedRevision: 'obligacje-calculator-00042-abc',
    });
  });
});
