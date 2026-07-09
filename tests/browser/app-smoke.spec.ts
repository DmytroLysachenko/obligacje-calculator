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

    await page.route('**/api/sync/opportunistic', async (requestRoute) => {
      await requestRoute.fulfill({ status: 204, body: '' });
    });

    await page.goto(route.path, { waitUntil: 'networkidle' });

    expect((await page.title()).trim()).not.toBe('');
    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('nav[aria-label]').first()).toBeAttached();
    await expect(page.locator('a[href="#main-content"]').first()).toBeAttached();

    expect(pageErrors).toEqual([]);
    expect(consoleErrors.filter((message) => !message.includes('Failed to load resource'))).toEqual(
      [],
    );
  });
}
