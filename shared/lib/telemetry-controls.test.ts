import { describe, expect, it } from 'vitest';

import { shouldReportWebVital } from './telemetry-controls';

describe('web vital telemetry controls', () => {
  it('honours browser privacy signals before sampling', () => {
    expect(shouldReportWebVital({ doNotTrack: '1' }, 0)).toBe(false);
    expect(shouldReportWebVital({ globalPrivacyControl: true }, 0)).toBe(false);
  });

  it('uses a bounded deterministic sample decision', () => {
    expect(shouldReportWebVital({}, 0.09)).toBe(true);
    expect(shouldReportWebVital({}, 0.1)).toBe(false);
  });
});
