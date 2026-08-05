const isIndexableEnvironment = process.env.NEXT_PUBLIC_DEPLOYMENT_TIER === 'production';

module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: 'node scripts/start-playwright-server.mjs',
      startServerReadyPattern: 'Ready',
      startServerReadyTimeout: 60_000,
      url: [
        'http://127.0.0.1:3100/',
        'http://127.0.0.1:3100/single-calculator',
        'http://127.0.0.1:3100/economic-data',
        'http://127.0.0.1:3100/compare',
        'http://127.0.0.1:3100/regular-investment',
      ],
      settings: {
        chromeFlags:
          '--no-sandbox --headless=new --user-data-dir=/tmp/obligacje-calculator-lighthouse',
      },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:performance': ['warn', { minScore: 0.7 }],
        ...(isIndexableEnvironment
          ? { 'categories:seo': ['error', { minScore: 0.9 }] }
          : { 'is-crawlable': 'off' }),
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
