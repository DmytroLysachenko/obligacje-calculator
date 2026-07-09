import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { getCanonicalBaseUrl, getCanonicalUrl } from '@/lib/site-url';

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
    process.env.NEXT_PUBLIC_APP_URL = 'https://seo.example';

    try {
      expect(robots().sitemap).toBe('https://seo.example/sitemap.xml');
      expect(sitemap().map((item) => item.url)).toEqual(
        expect.arrayContaining([
          'https://seo.example',
          'https://seo.example/single-calculator',
          'https://seo.example/economic-data',
        ]),
      );
    } finally {
      process.env.NEXT_PUBLIC_APP_URL = previous;
    }
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
