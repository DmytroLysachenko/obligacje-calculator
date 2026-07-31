import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { pageRouteByKey } from '@/lib/page-metadata';
import { getCanonicalBaseUrl, getCanonicalUrl, isIndexableDeployment } from '@/lib/site-url';

import robots from './robots';
import sitemap from './sitemap';

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), 'utf8');
}

describe('SEO metadata contract', () => {
  it('uses one canonical base URL for production metadata routes', () => {
    const env = {
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_URL: 'https://example.test/',
    } as NodeJS.ProcessEnv;

    expect(getCanonicalBaseUrl(env)).toBe('https://example.test');
    expect(getCanonicalUrl('/single-calculator', env)).toBe(
      'https://example.test/single-calculator',
    );
  });

  it('keeps robots and sitemap on the configured public app URL', () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    const previousTier = process.env.NEXT_PUBLIC_DEPLOYMENT_TIER;
    process.env.NEXT_PUBLIC_APP_URL = 'https://seo.example';
    process.env.NEXT_PUBLIC_DEPLOYMENT_TIER = 'production';

    try {
      expect(robots().sitemap).toBe('https://seo.example/sitemap.xml');
      expect(sitemap().map((item) => item.url)).toEqual(
        expect.arrayContaining([
          'https://seo.example',
          'https://seo.example/single-calculator',
          'https://seo.example/economic-data',
        ]),
      );
      expect(sitemap().every((item) => item.lastModified === undefined)).toBe(true);
    } finally {
      process.env.NEXT_PUBLIC_APP_URL = previous;
      process.env.NEXT_PUBLIC_DEPLOYMENT_TIER = previousTier;
    }
  });

  it('keeps private previews out of search indexes', () => {
    expect(
      isIndexableDeployment({ NODE_ENV: 'test', NEXT_PUBLIC_DEPLOYMENT_TIER: 'preview' }),
    ).toBe(false);
    expect(
      isIndexableDeployment({ NODE_ENV: 'test', NEXT_PUBLIC_DEPLOYMENT_TIER: 'production' }),
    ).toBe(true);
  });

  it('gives previews and production-like deployments distinct robots directives', () => {
    const previousTier = process.env.NEXT_PUBLIC_DEPLOYMENT_TIER;
    const previousUrl = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = 'https://seo.example';

    try {
      process.env.NEXT_PUBLIC_DEPLOYMENT_TIER = 'preview';
      expect(robots().rules).toEqual({ userAgent: '*', disallow: '/' });

      process.env.NEXT_PUBLIC_DEPLOYMENT_TIER = 'production';
      expect(robots().rules).toEqual({
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      });
      expect(robots().sitemap).toBe('https://seo.example/sitemap.xml');
    } finally {
      process.env.NEXT_PUBLIC_DEPLOYMENT_TIER = previousTier;
      process.env.NEXT_PUBLIC_APP_URL = previousUrl;
    }
  });

  it('maps every localized metadata page to a unique canonical public route', () => {
    const routes = Object.values(pageRouteByKey);

    expect(routes).toHaveLength(new Set(routes).size);
    expect(routes).toEqual(
      expect.arrayContaining([
        '/',
        '/single-calculator',
        '/compare',
        '/economic-data',
        '/education',
        '/regular-investment',
        '/ladder',
        '/retirement',
      ]),
    );
  });

  it('defines non-empty, unique metadata for every routed page key', () => {
    const messages = JSON.parse(read('i18n/translations/en.json')) as {
      metadata: { pages: Record<string, { title: string; description: string }> };
    };
    const entries = Object.keys(pageRouteByKey).map((key) => messages.metadata.pages[key]);

    expect(entries).toHaveLength(Object.keys(pageRouteByKey).length);
    expect(entries.every((entry) => entry?.title.trim() && entry.description.trim())).toBe(true);
    expect(new Set(entries.map((entry) => entry.title)).size).toBe(entries.length);
  });

  it('keeps root layout metadata and JSON-LD free of legacy Vercel URLs', () => {
    const layout = read('app/layout.tsx');
    const robotsSource = read('app/robots.ts');
    const sitemapSource = read('app/sitemap.ts');

    for (const source of [layout, robotsSource, sitemapSource]) {
      expect(source).not.toContain('obligacje-calculator.vercel.app');
    }

    expect(layout).toContain('getCanonicalBaseUrl');
    expect(layout).toContain('createAppJsonLd');
  });
});
