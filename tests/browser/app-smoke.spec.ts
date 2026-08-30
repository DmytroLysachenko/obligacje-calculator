import { expect, test } from '@playwright/test';

import {
  expectNoBrowserDiagnostics,
  installBrowserDiagnostics,
  stubGuestPortfolioAccess,
  stubOpportunisticSync,
  stubWebVitals,
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

function defineSmokeTest(route: (typeof smokeRoutes)[number]) {
  test(`${route.name} renders without runtime errors`, async ({ page }, testInfo) => {
    const diagnostics = installBrowserDiagnostics(page);

    await stubOpportunisticSync(page);
    await stubGuestPortfolioAccess(page);
    await stubWebVitals(page);
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('nav[aria-label]').first()).toBeAttached();
    await expect(page.locator('a[href="#main-content"]').first()).toBeAttached();

    await expectNoBrowserDiagnostics(testInfo, diagnostics);
  });
}

for (const route of smokeRoutes.filter((route) => route.path !== '/notebook')) {
  defineSmokeTest(route);
}

test('shared content canvas aligns routes and prevents horizontal overflow', async ({ page }) => {
  await stubOpportunisticSync(page);
  await stubGuestPortfolioAccess(page);
  await stubWebVitals(page);

  const routes = ['/', '/single-calculator', '/compare', '/economic-data'];
  const canvasBoxes: { x: number; width: number }[] = [];

  for (const route of routes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });

    const canvas = page.locator('.ui-app-canvas').first();
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    canvasBoxes.push({ x: box!.x, width: box!.width });

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  }

  const firstCanvas = canvasBoxes[0];
  for (const canvas of canvasBoxes.slice(1)) {
    expect(canvas.x).toBeCloseTo(firstCanvas.x, 0);
    expect(canvas.width).toBeCloseTo(firstCanvas.width, 0);
  }
});

test.describe('portfolio notebook', () => {
  test.describe.configure({ retries: process.env.CI ? 2 : 0 });
  defineSmokeTest({ path: '/notebook', name: 'portfolio notebook' });
});
