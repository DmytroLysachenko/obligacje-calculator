import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Next 16 traces the CommonJS SWC helpers but omits their ESM counterparts
  // under pnpm. The server imports these at startup.
  outputFileTracingIncludes: {
    '/*': ['node_modules/.pnpm/@swc+helpers@*/node_modules/@swc/helpers/esm/**/*'],
  },
  // Enables Partial Prerendering: the request-specific locale/CSP shell can
  // stream independently while cacheable public component trees are reused.
  cacheComponents: true,
  experimental: {
    // Lucide's public entry point is a large icon barrel. Rewrite its named
    // imports at build time so each route only ships the icons it renders.
    optimizePackageImports: ['lucide-react'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

export default withNextIntl(nextConfig);
