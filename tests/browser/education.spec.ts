import { expect, test } from '@playwright/test';

import {
  expectNoBrowserDiagnostics,
  installBrowserDiagnostics,
  stubOpportunisticSync,
} from './browser-diagnostics';

test('education compares two selected offers in table order without browser diagnostics', async ({
  page,
}, testInfo) => {
  const diagnostics = installBrowserDiagnostics(page);

  await stubOpportunisticSync(page);
  await page.goto('/education', { waitUntil: 'networkidle' });

  const checkboxes = page.getByRole('checkbox');
  await checkboxes.nth(1).check();
  await checkboxes.nth(0).check();

  await expect(page.getByText(/Wybrano: 2/)).toBeVisible();
  const compareSelected = page.getByRole('link', { name: 'Porównaj wybrane' });
  await expect(compareSelected).toHaveAttribute('href', '/compare?a=OTS&b=TOS');
  await expect(checkboxes.nth(2)).toBeDisabled();
  await expectNoBrowserDiagnostics(testInfo, diagnostics);
});

test('education comparison table remains keyboard-focusable and horizontally scrollable on mobile', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile-specific interaction assertion');
  const diagnostics = installBrowserDiagnostics(page);

  await stubOpportunisticSync(page);
  await page.goto('/education', { waitUntil: 'networkidle' });

  const scrollRegion = page.locator('.ui-table-scroll-region').first();
  await scrollRegion.focus();
  await expect(scrollRegion).toBeFocused();
  expect(await scrollRegion.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
    true,
  );

  await expectNoBrowserDiagnostics(testInfo, diagnostics);
});
