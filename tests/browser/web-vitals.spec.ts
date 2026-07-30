import { expect, test } from '@playwright/test';

import {
  expectNoBrowserDiagnostics,
  installBrowserDiagnostics,
  stubOpportunisticSync,
} from './browser-diagnostics';

const budgetedRoutes = [
  { path: '/', name: 'home' },
  { path: '/single-calculator', name: 'single calculator' },
];

type BrowserMetrics = {
  domContentLoadedMs: number;
  loadEventMs: number;
  lcpMs: number | null;
  scriptCount: number;
  scriptTransferBytes: number;
};

function collectPerformanceEntries(): BrowserMetrics {
  const navigation = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const scripts = resources.filter((resource) => resource.initiatorType === 'script');
  const lcp = (window as typeof window & { __largestContentfulPaint?: number })
    .__largestContentfulPaint;

  return {
    domContentLoadedMs: navigation?.domContentLoadedEventEnd ?? 0,
    loadEventMs: navigation?.loadEventEnd ?? 0,
    lcpMs: lcp ?? null,
    scriptCount: scripts.length,
    scriptTransferBytes: scripts.reduce((sum, script) => sum + (script.transferSize || 0), 0),
  };
}

for (const route of budgetedRoutes) {
  test(`${route.name} stays within baseline browser budgets`, async ({ page }, testInfo) => {
    const diagnostics = installBrowserDiagnostics(page);

    await stubOpportunisticSync(page);
    await page.addInitScript(() => {
      new PerformanceObserver((entries) => {
        const latest = entries.getEntries().at(-1);
        if (latest) {
          (window as typeof window & { __largestContentfulPaint?: number }).__largestContentfulPaint =
            latest.startTime;
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
    await page.goto(route.path, { waitUntil: 'networkidle' });
    await expect(page.locator('main#main-content')).toBeVisible();

    const metrics = await page.evaluate(collectPerformanceEntries);

    console.info(`${route.name} browser budget metrics`, metrics);

    await expectNoBrowserDiagnostics(testInfo, diagnostics);
    expect(metrics.domContentLoadedMs).toBeGreaterThan(0);
    expect(metrics.domContentLoadedMs).toBeLessThan(4_000);
    expect(metrics.loadEventMs).toBeLessThan(6_000);
    expect(metrics.scriptCount).toBeLessThan(80);
    expect(metrics.scriptTransferBytes).toBeLessThan(1_500_000);

    expect(metrics.lcpMs).not.toBeNull();
    expect(metrics.lcpMs).toBeLessThan(2_500);
  });
}
