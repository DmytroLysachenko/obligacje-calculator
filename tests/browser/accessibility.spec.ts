import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import {
  expectNoBrowserDiagnostics,
  installBrowserDiagnostics,
  stubOpportunisticSync,
} from './browser-diagnostics';

const auditedRoutes = [
  { path: '/', name: 'home' },
  { path: '/single-calculator', name: 'single calculator' },
  { path: '/economic-data', name: 'economic data' },
  { path: '/retirement', name: 'retirement' },
];

for (const [locale, label] of [
  ['pl', /^data zakupu:/i],
  ['en', /^purchase date:/i],
] as const) {
  test(`comparison purchase-date control has a visible-name-compatible ${locale} name`, async ({ page }) => {
    await page.context().addCookies([
      { name: 'app-language', value: locale, domain: '127.0.0.1', path: '/' },
    ]);
    await stubOpportunisticSync(page);
    await page.goto('/compare', { waitUntil: 'networkidle' });

    const trigger = page.getByRole('button', { name: label }).first();
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAccessibleName(label);
    await expect(trigger).toContainText(/\d{4}/);
  });
}

test('serves the scoped runtime-style CSP required by charts and sheets', async ({ page }) => {
  const response = await page.goto('/economic-data', { waitUntil: 'domcontentloaded' });
  const policy = response?.headers()['content-security-policy'] ?? '';

  expect(policy).toContain("style-src-elem 'self' 'nonce-");
  expect(policy).toContain("style-src-attr 'unsafe-inline'");
  expect(policy).toMatch(/style-src 'self' 'nonce-[^']+';/);
  expect(policy).not.toMatch(/(?:^|;\s*)style-src\s[^;]*'unsafe-inline'/);
});

for (const route of auditedRoutes) {
  test(`${route.name} has no automated accessibility violations`, async ({ page }, testInfo) => {
    const diagnostics = installBrowserDiagnostics(page);
    await stubOpportunisticSync(page);
    await page.goto(route.path, { waitUntil: 'networkidle' });
    await expect(page.locator('main#main-content')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();

    await testInfo.attach('axe-results.json', {
      body: JSON.stringify(results, null, 2),
      contentType: 'application/json',
    });
    expect(results.violations).toEqual([]);
    await expectNoBrowserDiagnostics(testInfo, diagnostics);
  });
}
