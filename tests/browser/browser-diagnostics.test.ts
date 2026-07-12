import { describe, expect, it } from 'vitest';

import { DiagnosticEntry, isActionableDiagnosticEntry } from './browser-diagnostics';

describe('browser diagnostics filtering', () => {
  it('ignores aborted Next RSC prefetches while keeping real request failures actionable', () => {
    const entries: DiagnosticEntry[] = [
      {
        kind: 'requestfailed',
        message: 'net::ERR_ABORTED',
        url: 'http://127.0.0.1:3100/single-calculator?_rsc=1jae6',
      },
      {
        kind: 'requestfailed',
        message: 'net::ERR_ABORTED',
        url: 'http://127.0.0.1:3100/api/calculation-defaults',
      },
      {
        kind: 'requestfailed',
        message: 'net::ERR_CONNECTION_REFUSED',
        url: 'http://127.0.0.1:3100/single-calculator?_rsc=1jae6',
      },
    ];

    expect(entries.filter(isActionableDiagnosticEntry)).toEqual([entries[1], entries[2]]);
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
