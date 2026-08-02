import { MetadataRoute } from 'next';

import { getCanonicalUrl, isIndexableDeployment } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  if (!isIndexableDeployment()) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: getCanonicalUrl('/sitemap.xml'),
  };
}
