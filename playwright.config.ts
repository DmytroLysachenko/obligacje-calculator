import { defineConfig, devices } from '@playwright/test';

process.env.PLAYWRIGHT_SMOKE = process.env.PLAYWRIGHT_SMOKE ?? '1';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm exec next start --port 3100',
    url: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3100',
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
