import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculationService } from './application-service';
import { ScenarioKind } from './types/scenarios';
import { BondType, InterestPayout, TaxStrategy } from './types';

// Mock data-access to simulate DB interaction without a real DB
vi.mock('@/lib/data-access', () => ({
  getHistoricalDataMap: vi.fn().mockResolvedValue({
    '2023-01': { inflation: 17.2, nbpRate: 6.75 },
    '2023-02': { inflation: 18.4, nbpRate: 6.75 },
    '2023-03': { inflation: 16.1, nbpRate: 6.75 },
  }),
  getBondDefinitions: vi.fn().mockResolvedValue([]),
}));

describe('CalculationApplicationService - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate a single bond scenario using historical data from DB', async () => {
    const payload = {
      bondType: BondType.EDO,
      initialInvestment: 1000,
      firstYearRate: 6.75,
      expectedInflation: 2.5,
      expectedNbpRate: 5.75,
      margin: 2.0,
      duration: 10,
      earlyWithdrawalFee: 2.0,
      taxRate: 19,
      isCapitalized: true,
      payoutFrequency: InterestPayout.MATURITY,
      purchaseDate: '2023-03-01',
      withdrawalDate: '2024-03-01',
      isRebought: false,
      rebuyDiscount: 0.10,
      taxStrategy: TaxStrategy.STANDARD,
    };

    const envelope = await calculationService.calculate({
      kind: ScenarioKind.SINGLE_BOND,
      payload,
    });

    expect(envelope.calculationVersion).toContain('production-ready');
    expect(envelope.result).toBeDefined();
    // Verify it used the historical data for the first year if applicable
    // (EDO uses fixed first year, but let's check envelope metadata)
    expect(envelope.calculationNotes).toContain('Macro inputs were resolved from historical data where available.');
  });
});
