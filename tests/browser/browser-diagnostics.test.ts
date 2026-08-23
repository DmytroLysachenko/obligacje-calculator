import { describe, expect, it } from 'vitest';

import { DiagnosticEntry, isActionableDiagnosticEntry } from './browser-diagnostics';

describe('browser diagnostics filtering', () => {
  it('ignores browser-cancelled requests while keeping real request failures actionable', () => {
    const entries: DiagnosticEntry[] = [
      {
        kind: 'requestfailed',
        message: 'net::ERR_ABORTED',
        url: 'http://127.0.0.1:3100/single-calculator?_rsc=1jae6',
      },
      {
        kind: 'requestfailed',
        message: 'NS_BINDING_ABORTED',
        url: 'http://127.0.0.1:3100/api/observability/vitals',
      },
      {
        kind: 'requestfailed',
        message: 'Load request cancelled',
        url: 'http://127.0.0.1:3100/single-calculator?_rsc=1jae6',
      },
      {
        kind: 'requestfailed',
        message: 'net::ERR_CONNECTION_REFUSED',
        url: 'http://127.0.0.1:3100/single-calculator?_rsc=1jae6',
      },
    ];

    expect(entries.filter(isActionableDiagnosticEntry)).toEqual([entries[3]]);
  });

  it('ignores browser-specific page errors caused by cancelled RSC navigation', () => {
    expect(
      isActionableDiagnosticEntry({
        kind: 'pageerror',
        message: '/127.0.0.1:3100/ladder?_rsc=1jae6 due to access control checks.',
      }),
    ).toBe(false);
  });

  it('keeps React hydration errors actionable with their enriched page error payload', () => {
    expect(
      isActionableDiagnosticEntry({
        kind: 'pageerror',
        message: 'Minified React error #418',
      }),
    ).toBe(true);
  });
});
