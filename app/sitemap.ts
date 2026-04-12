import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://obligacje-calculator.vercel.app';
  const lastModified = new Date();

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
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
