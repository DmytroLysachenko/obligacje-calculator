import { describe, expect, it, vi } from 'vitest';

import { getLocalizedPageMetadata } from '@/lib/page-metadata';

vi.mock('next-intl/server', () => ({
  getLocale: vi.fn(async () => 'en'),
  getTranslations: vi.fn(async (namespace: string) => {
    if (namespace === 'common') {
      return (key: string) => ({ title: 'Bonds Calculator' })[key as 'title'];
    }

    if (namespace === 'site') {
      return (key: string) =>
        ({ twitter_description: 'Twitter description' })[key as 'twitter_description'];
    }

    if (namespace === 'metadata.pages.single_calculator') {
      return (key: string) =>
        ({
          title: 'Single Calculator',
          description: 'Localized page description',
        })[key as 'title' | 'description'];
    }

    throw new Error(`Unexpected namespace: ${namespace}`);
  }),
}));

describe('getLocalizedPageMetadata', () => {
  it('builds localized page metadata with canonical and social fields', async () => {
    await expect(getLocalizedPageMetadata('single_calculator')).resolves.toEqual({
      title: 'Single Calculator',
      description: 'Localized page description',
      robots: undefined,
      alternates: {
        canonical: 'http://localhost:3000/single-calculator',
      },
      openGraph: {
        title: 'Single Calculator | Bonds Calculator',
        description: 'Localized page description',
        url: 'http://localhost:3000/single-calculator',
        siteName: 'Bonds Calculator',
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: 'Single Calculator | Bonds Calculator',
        description: 'Twitter description',
      },
    });
  });
});
