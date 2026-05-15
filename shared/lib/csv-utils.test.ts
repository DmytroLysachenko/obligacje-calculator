import { describe, expect, it } from 'vitest';
import { convertLotsToCSV, convertTimelineToCSV } from './csv-utils';
import { buildLotsExportHeaders, buildTimelineExportHeaders } from './export-headers';
import type { YearlyTimelinePoint, LotBreakdown } from '@/features/bond-core/types';

describe('csv-utils', () => {
  it('builds a normalized timeline csv with localized helper columns', () => {
    const headers = buildTimelineExportHeaders((key) => key, 'pl');
    const timeline = [
      {
        year: 1,
        interestRate: 6.5,
        interestEarned: 650,
        nominalValueAfterInterest: 10650,
        taxPaid: 0,
        realValue: 10300,
        totalValue: 10650,
        cycleStartDate: '2026-05-14',
        cycleEndDate: '2027-05-14',
        isProjected: false,
        rateSource: 'initial_principal',
        eventType: 'purchase',
      },
    ] as unknown as YearlyTimelinePoint[];

    const csv = convertTimelineToCSV(timeline, headers, 'pl');

    expect(csv).toContain('Jak czytac ten wiersz');
    expect(csv).toContain('Tryb danych');
    expect(csv).toContain('Kontrolny punkt scenariusza');
  });

  it('builds lot csv using the selected locale formatting', () => {
    const headers = buildLotsExportHeaders((key) => key, 'pl');
    const lots = [
      {
        purchaseDate: '2026-05-14',
        maturityDate: '2030-05-14',
        investedAmount: 10000,
        accumulatedInterest: 1200.5,
        tax: 228.1,
        earlyWithdrawalFee: 0,
        netValue: 10972.4,
      },
    ] as LotBreakdown[];

    const csv = convertLotsToCSV(lots, headers, 'pl');

    expect(csv).toContain('"2026-05-14"');
    expect(csv).toContain('1200,50');
    expect(csv).toContain('10972,40');
  });
});
