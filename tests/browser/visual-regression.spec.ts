import { expect, type Page, test } from '@playwright/test';

import {
  expectNoBrowserDiagnostics,
  installBrowserDiagnostics,
  stubOpportunisticSync,
} from './browser-diagnostics';

async function openVisualRoute(page: Page, locale: 'en' | 'pl', path: string) {
  await page
    .context()
    .addCookies([{ name: 'app-language', value: locale, domain: '127.0.0.1', path: '/' }]);
  await stubOpportunisticSync(page);
  await page.goto(path, { waitUntil: 'networkidle' });
  await expect(page.locator('main#main-content')).toBeVisible();
}

test.describe('visual regression', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Linux Chromium owns visual baselines');
  });

  test('home stays stable in English desktop light mode', async ({ page }, testInfo) => {
    const diagnostics = installBrowserDiagnostics(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
    await openVisualRoute(page, 'en', '/');

    await expect(page.locator('main#main-content')).toHaveScreenshot('home-en-desktop-light.png', {
      animations: 'disabled',
    });
    await expectNoBrowserDiagnostics(testInfo, diagnostics);
  });

  test('comparison stays stable in Polish mobile light mode', async ({ page }, testInfo) => {
    const diagnostics = installBrowserDiagnostics(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
    await openVisualRoute(page, 'pl', '/compare');

    await expect(page.locator('main#main-content')).toHaveScreenshot(
      'comparison-pl-mobile-light.png',
      {
        animations: 'disabled',
      },
    );
    await expectNoBrowserDiagnostics(testInfo, diagnostics);
  });

  test('comparison stays stable in Polish tablet dark mode', async ({ page }, testInfo) => {
    const diagnostics = installBrowserDiagnostics(page);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'no-preference' });
    await openVisualRoute(page, 'pl', '/compare');

    await expect(page.locator('main#main-content')).toHaveScreenshot(
      'comparison-pl-tablet-dark.png',
      {
        animations: 'disabled',
      },
    );
    await expectNoBrowserDiagnostics(testInfo, diagnostics);
  });

  test('calculator stays stable at 200 percent zoom', async ({ page }, testInfo) => {
    const diagnostics = installBrowserDiagnostics(page);
    await page.setViewportSize({ width: 1280, height: 1000 });
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
    await openVisualRoute(page, 'pl', '/single-calculator');

    await expect(page.locator('main#main-content')).toHaveScreenshot(
      'calculator-pl-200-percent.png',
      {
        animations: 'disabled',
      },
    );
    await client.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 });
    await expectNoBrowserDiagnostics(testInfo, diagnostics);
  });

  test('comparison stays stable with reduced motion', async ({ page }, testInfo) => {
    const diagnostics = installBrowserDiagnostics(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
    await openVisualRoute(page, 'en', '/compare');

    await expect(page.locator('main#main-content')).toHaveScreenshot(
      'comparison-en-mobile-reduced-motion.png',
      {
        animations: 'disabled',
      },
    );
    await expectNoBrowserDiagnostics(testInfo, diagnostics);
  });
});
