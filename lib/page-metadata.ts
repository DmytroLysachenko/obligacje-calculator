import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { getCanonicalUrl } from './site-url';

const pageRouteByKey: Record<string, string> = {
  home: '/',
  single_calculator: '/single-calculator',
  comparison: '/compare',
  economic_data: '/economic-data',
  education: '/education',
  notebook: '/notebook',
  login: '/login',
  optimize: '/optimize',
  regular_investment: '/regular-investment',
  ladder: '/ladder',
  multi_asset: '/multi-asset',
  retirement: '/retirement',
  recovery_lab: '/recovery-lab',
};

export async function getLocalizedPageMetadata(pageKey: string): Promise<Metadata> {
  const common = await getTranslations('common');
  const site = await getTranslations('site');
  const page = await getTranslations(`metadata.pages.${pageKey}`);
  const title = page('title');
  const socialTitle = `${title} | ${common('title')}`;
  const description = page('description');
  const canonicalUrl = getCanonicalUrl(pageRouteByKey[pageKey] ?? '/');

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: socialTitle,
      description,
      url: canonicalUrl,
      siteName: common('title'),
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: socialTitle,
      description: site('twitter_description'),
    },
  };
}
