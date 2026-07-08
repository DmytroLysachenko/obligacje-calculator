import { describe, expect, it } from 'vitest';

import { createAppJsonLd } from './app-json-ld';

describe('createAppJsonLd', () => {
  it('builds canonical structured data for the application and bond product', () => {
    const jsonLd = createAppJsonLd({
      appName: 'Obligacje Calculator',
      description: 'Educational calculator for Polish Treasury Bonds.',
      baseUrl: 'https://example.test/',
    });

    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@graph']).toEqual([
      expect.objectContaining({
        '@type': 'WebApplication',
        name: 'Obligacje Calculator',
        url: 'https://example.test',
        applicationCategory: 'FinanceApplication',
        potentialAction: expect.objectContaining({
          '@type': 'CalculateAction',
          target: 'https://example.test/single-calculator',
        }),
      }),
      expect.objectContaining({
        '@type': 'FinancialProduct',
        name: 'Polish Treasury Bonds',
        provider: expect.objectContaining({
          '@type': 'GovernmentOrganization',
          name: 'Ministerstwo Finansow',
        }),
      }),
    ]);
  });
});
