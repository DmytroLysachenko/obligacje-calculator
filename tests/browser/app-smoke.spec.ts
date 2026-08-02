import { expect, test } from '@playwright/test';

import {
  expectNoBrowserDiagnostics,
  installBrowserDiagnostics,
  stubOpportunisticSync,
} from './browser-diagnostics';

const smokeRoutes = [
  { path: '/', name: 'home' },
  { path: '/education', name: 'education' },
  { path: '/single-calculator', name: 'single calculator' },
  { path: '/compare', name: 'comparison' },
  { path: '/regular-investment', name: 'regular investment' },
  { path: '/ladder', name: 'ladder strategy' },
  { path: '/notebook', name: 'portfolio notebook' },
  { path: '/economic-data', name: 'economic data' },
];

for (const route of smokeRoutes) {
  test(`${route.name} renders without runtime errors`, async ({ page }, testInfo) => {
    const diagnostics = installBrowserDiagnostics(page);

    await stubOpportunisticSync(page);
    await page.goto(route.path, { waitUntil: 'networkidle' });

    expect((await page.title()).trim()).not.toBe('');
    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('nav[aria-label]').first()).toBeAttached();
    await expect(page.locator('a[href="#main-content"]').first()).toBeAttached();

    await expectNoBrowserDiagnostics(testInfo, diagnostics);
  });
}
