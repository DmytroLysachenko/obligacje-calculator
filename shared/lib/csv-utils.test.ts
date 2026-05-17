import { describe, expect, it } from 'vitest';
import { convertLotsToCSV, convertTimelineToCSV } from './csv-utils';
import { buildLotsExportHeaders, buildTimelineExportHeaders } from './export-headers';
import { t } from '@/i18n';
import type { YearlyTimelinePoint, LotBreakdown } from '@/features/bond-core/types';
import { SimulationEventType } from '@/features/bond-core/types/simulation';

describe('csv-utils', () => {
  it('builds a normalized timeline csv with localized helper columns', () => {
    const headers = buildTimelineExportHeaders((key) => t(key, undefined, 'pl'));
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

    expect(csv).toContain('Jak to zostało obliczone');
    expect(csv).toContain('Prognozowane');
    expect(csv).toContain('Kontrolny punkt scenariusza');
  });

  it('exports payout-bond timeline rows with total wealth and early exit semantics', () => {
    const headers = buildTimelineExportHeaders((key) => t(key, undefined, 'en'));
    const timeline = [
      {
        periodLabel: 'Jun 2026',
        cycleIndex: 1,
        cycleStartDate: '2026-06-01',
        cycleEndDate: '2026-06-30',
        interestRate: 5.25,
        rateSource: 'historical_nbp',
        nominalValueBeforeInterest: 10000,
        interestEarned: 43,
        taxDeducted: 0,
        netInterest: 43,
        nominalValueAfterInterest: 10000,
        accumulatedNetInterest: 43,
        totalValue: 10043,
        realValue: 9950,
        netProfit: 43,
        earlyWithdrawalValue: 10021,
        isMaturity: false,
        isWithdrawal: false,
        cumulativeInflation: 1.02,
        events: [
          {
            type: SimulationEventType.PAYOUT,
            date: '2026-06-30',
            description: 'Monthly payout',
          },
        ],
      },
    ] as unknown as YearlyTimelinePoint[];

    const csv = convertTimelineToCSV(timeline, headers, 'en');

    expect(csv).toContain('Interest Payment');
    expect(csv).toContain('Final Nominal Value');
    expect(csv).toContain('Early Exit Payout');
    expect(csv).toContain('Payout or rollover point');
  });

  it('builds lot csv using the selected locale formatting', () => {
    const headers = buildLotsExportHeaders((key) => t(key, undefined, 'pl'));
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
