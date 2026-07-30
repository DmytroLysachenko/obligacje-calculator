import { describe, expect, it } from 'vitest';

import { isIsoCalendarDate,IsoCalendarDateSchema } from './iso-calendar-date';

describe('ISO calendar date', () => {
  it.each(['2024-02-29', '2026-01-01', '2000-02-29', '2099-12-31'])('accepts %s', (value) => {
    expect(isIsoCalendarDate(value)).toBe(true);
    expect(IsoCalendarDateSchema.parse(value)).toBe(value);
  });

  it.each([
    '2026-02-29', '2025-02-29', '2026-02-30', '2026-00-01', '2026-13-01',
    '2026-01-00', '2026-01-32', '26-01-01', '2026-1-01', '2026-01-1', '',
  ])('rejects impossible or non-canonical input %s', (value) => {
    expect(isIsoCalendarDate(value)).toBe(false);
    expect(IsoCalendarDateSchema.safeParse(value).success).toBe(false);
  });
});
