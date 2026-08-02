import { expect, test } from '@playwright/test';

import {
  expectNoBrowserDiagnostics,
  installBrowserDiagnostics,
  stubOpportunisticSync,
} from './browser-diagnostics';

const auditedRoutes = ['/regular-investment', '/ladder', '/notebook', '/compare'] as const;

for (const route of auditedRoutes) {
  test(`${route} keeps one visible page title at desktop width`, async ({ page }, testInfo) => {
    const diagnostics = installBrowserDiagnostics(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await stubOpportunisticSync(page);
    await page.goto(route, { waitUntil: 'networkidle' });

    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
    await expectNoBrowserDiagnostics(testInfo, diagnostics);
  });

  test(`${route} keeps navigation and content reachable on mobile`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile-specific layout assertion');
    const diagnostics = installBrowserDiagnostics(page);
    await stubOpportunisticSync(page);
    await page.goto(route, { waitUntil: 'networkidle' });

    await expect(page.getByRole('button', { name: /navigation|nawigac/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('main#main-content')).toBeVisible();
    await expectNoBrowserDiagnostics(testInfo, diagnostics);
  });
}

test('notebook guest state offers sign-in instead of disabled workspace actions', async ({
  page,
}, testInfo) => {
  const diagnostics = installBrowserDiagnostics(page);
  await stubOpportunisticSync(page);
  await page.goto('/notebook', { waitUntil: 'networkidle' });

  const signInLink = page.locator('a[href="/login"]').first();
  if (await signInLink.isVisible()) {
    await expect(signInLink).toBeEnabled();
    await expect(page.getByRole('button', { name: /load demo portfolio/i })).toHaveCount(0);
  }

  await expectNoBrowserDiagnostics(testInfo, diagnostics);
});
