import { MetadataRoute } from 'next';

import { getCanonicalBaseUrl, isIndexableDeployment } from '@/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isIndexableDeployment()) {
    return [];
  }

  const baseUrl = getCanonicalBaseUrl();
  const routes = [
    '',
    '/single-calculator',
    '/compare',
    '/regular-investment',
    '/ladder',
    '/economic-data',
    '/education',
    '/multi-asset',
    '/notebook',
    '/optimize',
    '/retirement',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
