import { expect, Page, TestInfo } from '@playwright/test';

export type DiagnosticEntry = {
  kind: 'console' | 'pageerror' | 'requestfailed' | 'response';
  message: string;
  url?: string;
  status?: number;
};

const ignoredConsoleErrors = ['Failed to load resource'];

function enrichMessage(message: string) {
  if (message.includes('Minified React error #418')) {
    return `${message} | Hint: React hydration mismatch, usually invalid SSR HTML or client/server markup drift.`;
  }

  return message;
}

const abortedRequestMessages = new Set([
  'net::ERR_ABORTED',
  'Load request cancelled',
  'NS_BINDING_ABORTED',
]);

function isBrowserCancelledRequest(entry: DiagnosticEntry) {
  if (entry.kind !== 'requestfailed' || !abortedRequestMessages.has(entry.message)) {
    return false;
  }

  return true;
}

function isRscAccessControlCancellation(entry: DiagnosticEntry) {
  return (
    entry.kind === 'pageerror' &&
    entry.message.includes('?_rsc=') &&
    entry.message.includes('due to access control checks.')
  );
}

function isFirefoxCancelledOperation(entry: DiagnosticEntry) {
  return (
    entry.kind === 'pageerror' &&
    ['The operation was aborted.', 'NetworkError when attempting to fetch resource.'].includes(
      entry.message.trim(),
    )
  );
}

export function isActionableDiagnosticEntry(entry: DiagnosticEntry) {
  if (
    entry.kind === 'console' &&
    ignoredConsoleErrors.some((ignored) => entry.message.includes(ignored))
  ) {
    return false;
  }

  if (isBrowserCancelledRequest(entry)) {
    return false;
  }

  if (isRscAccessControlCancellation(entry)) {
    return false;
  }

  if (isFirefoxCancelledOperation(entry)) {
    return false;
  }

  return true;
}

export function installBrowserDiagnostics(page: Page) {
  const entries: DiagnosticEntry[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      entries.push({ kind: 'console', message: enrichMessage(message.text()) });
    }
  });

  page.on('pageerror', (error) => {
    entries.push({ kind: 'pageerror', message: enrichMessage(error.message) });
  });

  page.on('requestfailed', (request) => {
    entries.push({
      kind: 'requestfailed',
      message: request.failure()?.errorText ?? 'request failed',
      url: request.url(),
    });
  });

  page.on('response', (response) => {
    if (response.status() >= 500) {
      entries.push({
        kind: 'response',
        message: response.statusText(),
        status: response.status(),
        url: response.url(),
      });
    }
  });

  return entries;
}

export async function stubOpportunisticSync(page: Page) {
  await page.route('**/api/sync/opportunistic', async (requestRoute) => {
    await requestRoute.fulfill({ status: 204, body: '' });
  });
}

export async function stubWebVitals(page: Page) {
  await page.route('**/api/observability/vitals', async (requestRoute) => {
    await requestRoute.fulfill({ status: 204, body: '' });
  });
}

export async function stubGuestPortfolioAccess(page: Page) {
  await page.route('**/api/portfolio/access', async (requestRoute) => {
    await requestRoute.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          ownerId: 'playwright-guest',
          isGuest: true,
          authMode: 'guest',
          canManageWorkspace: false,
        },
      }),
    });
  });
}

export async function expectNoBrowserDiagnostics(
  testInfo: TestInfo,
  entries: readonly DiagnosticEntry[],
) {
  const actionableEntries = entries.filter(isActionableDiagnosticEntry);

  if (actionableEntries.length > 0) {
    await testInfo.attach('browser-diagnostics.json', {
      body: JSON.stringify(actionableEntries, null, 2),
      contentType: 'application/json',
    });
  }

  expect(actionableEntries).toEqual([]);
}
