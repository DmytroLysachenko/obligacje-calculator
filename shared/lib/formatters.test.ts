import { describe, expect, it } from 'vitest';

import {
  createCurrencyFormatter,
  createDateFormatter,
  createPercentageFormatter,
} from './formatters';

describe('shared formatters', () => {
  it('formats PLN currency through locale-aware helpers', () => {
    const formatted = createCurrencyFormatter('en', {
      maximumFractionDigits: 0,
    }).format(12345);

    expect(formatted).toContain('12');
    expect(formatted).toContain('345');
    expect(formatted).toContain('PLN');
  });

  it('formats percentages without forcing page-local string composition', () => {
    const formatted = createPercentageFormatter('en', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(0.045);

    expect(formatted).toBe('4.5%');
  });

  it('formats dates through explicit locale helpers', () => {
    const formatted = createDateFormatter('pl', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    }).format(new Date('2026-05-24T00:00:00.000Z'));

    expect(formatted).toContain('2026');
  });
});
