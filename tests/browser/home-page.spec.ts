import { expect, test } from '@playwright/test';

import {
  expectNoBrowserDiagnostics,
  installBrowserDiagnostics,
  stubOpportunisticSync,
} from './browser-diagnostics';

const homeRoutes = [
  '/single-calculator',
  '/education',
  '/economic-data',
  '/compare',
  '/regular-investment',
  '/ladder',
  '/notebook',
] as const;

for (const path of homeRoutes) {
  test(`home keeps ${path} discoverable`, async ({ page }, testInfo) => {
    const diagnostics = installBrowserDiagnostics(page);

    await stubOpportunisticSync(page);
    await page.goto('/', { waitUntil: 'networkidle' });

    await expect(page.locator(`main#main-content a[href="${path}"]`).first()).toBeVisible();
    await expectNoBrowserDiagnostics(testInfo, diagnostics);
  });
}

test('home primary action opens the single-bond calculator', async ({ page }, testInfo) => {
  const diagnostics = installBrowserDiagnostics(page);

  await stubOpportunisticSync(page);
  await page.goto('/', { waitUntil: 'networkidle' });

  await expect(
    page.locator('main#main-content a[href="/single-calculator"]').first(),
  ).toBeVisible();
  await expectNoBrowserDiagnostics(testInfo, diagnostics);
});
