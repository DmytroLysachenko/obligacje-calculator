import { describe, expect, it } from 'vitest';

import { applyTableRowLimit, getVisibleRowLabel } from './TableDensityControls';

describe('table density controls', () => {
  const rows = Array.from({ length: 60 }, (_, index) => index + 1);

  it('limits rows to the selected compact sizes', () => {
    expect(applyTableRowLimit(rows, 12)).toHaveLength(12);
    expect(applyTableRowLimit(rows, 24)).toHaveLength(24);
    expect(applyTableRowLimit(rows, 50)).toHaveLength(50);
  });

  it('returns all rows when all is selected', () => {
    expect(applyTableRowLimit(rows, 'all')).toHaveLength(60);
  });

  it('formats visible row labels for partial and full views', () => {
    expect(getVisibleRowLabel({ visible: 12, total: 60, allLabel: 'shown' })).toBe('12 / 60 shown');
    expect(getVisibleRowLabel({ visible: 60, total: 60, allLabel: 'shown' })).toBe('60');
  });
});
