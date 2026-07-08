import { expect, test } from '@playwright/test';

const smokeRoutes = [
  { path: '/', name: 'home' },
  { path: '/single-calculator', name: 'single calculator' },
  { path: '/compare', name: 'comparison' },
  { path: '/economic-data', name: 'economic data' },
];

for (const route of smokeRoutes) {
  test(`${route.name} renders without runtime errors`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto(route.path, { waitUntil: 'networkidle' });

    await expect(page).toHaveTitle(/Bonds Calculator|Kalkulator obligacji/i);
    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(
      page.getByRole('navigation', { name: /primary navigation|główna nawigacja/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /skip to main content|przejdź do głównej treści/i }),
    ).toBeAttached();

    expect(pageErrors).toEqual([]);
    expect(consoleErrors.filter((message) => !message.includes('Failed to load resource'))).toEqual(
      [],
    );
  });
}
