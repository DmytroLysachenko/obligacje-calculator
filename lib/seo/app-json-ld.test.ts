import { describe, expect, it } from 'vitest';

import { createAppJsonLd, serializeJsonLd } from './app-json-ld';

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

  it('escapes characters that can terminate or mutate an inline script', () => {
    const serialized = serializeJsonLd({
      title: '</script><img src=x onerror=alert(1)>',
      text: 'A & B\u2028next\u2029last',
    });

    expect(serialized).not.toContain('</script>');
    expect(serialized).not.toContain('<img');
    expect(serialized).not.toContain(' & ');
    expect(serialized).toContain('\\u003c/script\\u003e');
    expect(serialized).toContain('\\u003cimg');
    expect(JSON.parse(serialized)).toEqual({
      title: '</script><img src=x onerror=alert(1)>',
      text: 'A & B\u2028next\u2029last',
    });
  });
});
