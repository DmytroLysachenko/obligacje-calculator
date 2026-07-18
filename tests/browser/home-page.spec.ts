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

  const primaryAction = page.getByRole('link', { name: 'Zasymuluj obligacje' });
  await expect(primaryAction).toBeVisible();
  await primaryAction.click();
  await expect(page).toHaveURL(/\/single-calculator$/);
  await expectNoBrowserDiagnostics(testInfo, diagnostics);
});

test('home keeps the first viewport visually stable', async ({ page }, testInfo) => {
  const diagnostics = installBrowserDiagnostics(page);

  await stubOpportunisticSync(page);
  await page.goto('/', { waitUntil: 'networkidle' });

  await expect(page.locator('main#main-content')).toHaveScreenshot('home-first-viewport.png');
  await expectNoBrowserDiagnostics(testInfo, diagnostics);
});
