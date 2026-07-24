import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'public/sw.js'), 'utf8');

describe('service worker cache policy', () => {
  it('does not provide a fake offline fallback for dynamic navigation', () => {
    const navigationBlock = source.slice(
      source.indexOf('if (isNavigationRequest)'),
      source.indexOf('if (STATIC_ASSETS.includes(url.pathname))'),
    );

    expect(navigationBlock).toContain('return;');
    expect(navigationBlock).not.toContain('event.respondWith');
    expect(navigationBlock).not.toContain("caches.match('/')");
  });

  it('only removes caches owned by this application', () => {
    expect(source).toContain("key.startsWith('bond-calculator-')");
    expect(source).toContain('key !== CACHE_NAME');
  });

  it('caches only declared static assets after a successful response', () => {
    expect(source).toContain('STATIC_ASSETS.includes(url.pathname)');
    expect(source).toContain('if (response.ok)');
    expect(source).toContain('cache.put(event.request, responseCopy)');
  });
});
