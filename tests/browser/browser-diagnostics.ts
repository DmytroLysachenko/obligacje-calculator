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

function isAbortedRscPrefetch(entry: DiagnosticEntry) {
  if (entry.kind !== 'requestfailed' || entry.message !== 'net::ERR_ABORTED' || !entry.url) {
    return false;
  }

  try {
    return new URL(entry.url).searchParams.has('_rsc');
  } catch {
    return false;
  }
}

export function isActionableDiagnosticEntry(entry: DiagnosticEntry) {
  if (
    entry.kind === 'console' &&
    ignoredConsoleErrors.some((ignored) => entry.message.includes(ignored))
  ) {
    return false;
  }

  if (isAbortedRscPrefetch(entry)) {
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
