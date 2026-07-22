import { describe, expect, it } from 'vitest';

import { BondType, TaxStrategy } from '@/features/bond-core/types';

import { buildSingleReportFilename } from './single-calculator-container-model';

describe('single calculator report filename', () => {
  const inputs = {
    bondType: BondType.ROR,
    taxStrategy: TaxStrategy.STANDARD,
  } as Parameters<typeof buildSingleReportFilename>[0];

  it('includes the report language and an ISO date', () => {
    const now = new Date('2026-07-22T12:00:00.000Z');

    expect(buildSingleReportFilename(inputs, 'pl', now)).toBe('bond_report_pl_ROR_2026-07-22.pdf');
    expect(buildSingleReportFilename(inputs, 'en', now)).toBe('bond_report_en_ROR_2026-07-22.pdf');
  });
});
