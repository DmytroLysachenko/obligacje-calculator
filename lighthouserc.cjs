module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      startServerCommand: 'node scripts/start-playwright-server.mjs',
      startServerReadyPattern: 'Ready',
      startServerReadyTimeout: 60_000,
      url: [
        'http://127.0.0.1:3100/',
        'http://127.0.0.1:3100/single-calculator',
        'http://127.0.0.1:3100/economic-data',
      ],
      settings: {
        chromeFlags: '--no-sandbox --headless=new',
      },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:seo': ['error', { minScore: 0.9 }],
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
