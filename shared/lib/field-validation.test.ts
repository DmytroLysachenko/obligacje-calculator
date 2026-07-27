import { describe, expect, it } from 'vitest';

import { getFirstFieldIssue, validateDateField, validateNumberField } from './field-validation';

describe('field validation', () => {
  it('validates numeric minimums and bond denomination increments', () => {
    expect(
      validateNumberField(150, { label: 'Investment', min: 100, multipleOf: 100 }),
    ).toMatchObject([{ code: 'multiple', severity: 'error' }]);
  });
  it('rejects a date outside its allowed range', () => {
    expect(
      validateDateField('2025-01-01', { label: 'Purchase date', min: '2026-01-01' })[0]?.code,
    ).toBe('minimum-date');
  });
  it('finds the first blocking field in visual order', () => {
    expect(
      getFirstFieldIssue({
        amount: [],
        date: [{ code: 'required', message: 'Required', severity: 'error' }],
      }),
    ).toMatchObject({ field: 'date' });
  });
});
