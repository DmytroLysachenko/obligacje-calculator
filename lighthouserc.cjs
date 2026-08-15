/* eslint-disable @typescript-eslint/no-require-imports -- Lighthouse loads CommonJS config. */
const { existsSync, readdirSync } = require('node:fs');
const { homedir } = require('node:os');
const { join } = require('node:path');

const isIndexableEnvironment = process.env.NEXT_PUBLIC_DEPLOYMENT_TIER === 'production';

function findPlaywrightChromium() {
  const cacheRoot = join(homedir(), '.cache', 'ms-playwright');

  if (!existsSync(cacheRoot)) {
    return undefined;
  }

  return readdirSync(cacheRoot)
    .filter((entry) => entry.startsWith('chromium-'))
    .map((entry) => join(cacheRoot, entry, 'chrome-linux64', 'chrome'))
    .find((executable) => existsSync(executable));
}

const chromePath = process.env.LHCI_CHROME_PATH ?? findPlaywrightChromium();

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
        ...(chromePath ? { chromePath } : {}),
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
