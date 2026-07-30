import { getCanonicalBaseUrl } from '@/lib/site-url';

type AppJsonLdInput = {
  appName: string;
  description: string;
  baseUrl?: string;
};

/** Serializes JSON-LD safely for an inline script element. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function createAppJsonLd({
  appName,
  description,
  baseUrl = getCanonicalBaseUrl(),
}: AppJsonLdInput) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: appName,
        description,
        url: normalizedBaseUrl,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'PLN',
        },
        potentialAction: {
          '@type': 'CalculateAction',
          name: 'Calculate Bond Profit',
          target: `${normalizedBaseUrl}/single-calculator`,
        },
      },
      {
        '@type': 'FinancialProduct',
        name: 'Polish Treasury Bonds',
        description: 'EDO, COI, ROR, DOR, TOS, OTS bond calculations.',
        provider: {
          '@type': 'GovernmentOrganization',
          name: 'Ministerstwo Finansow',
        },
      },
    ],
  };
}
