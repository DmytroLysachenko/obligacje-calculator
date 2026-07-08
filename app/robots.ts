import { MetadataRoute } from 'next';

import { getCanonicalUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: getCanonicalUrl('/sitemap.xml'),
  };
}
