import { describe, expect, it, vi } from 'vitest';

import { BondType, InterestPayout, TaxStrategy } from '@/features/bond-core/types';

import { apiPost } from './api-client';
import { scenarioShareClient } from './scenario-share-client';
import { SharedSingleScenarioPayload } from './single-scenario-share';

vi.mock('./api-client', () => ({
  apiPost: vi.fn(),
}));

describe('scenario share client', () => {
  it('routes single scenario sharing through the shared API client', async () => {
    const payload: SharedSingleScenarioPayload = {
      title: 'Single EDO 120M',
      description: 'Committed scenario',
      inputs: {
        bondType: BondType.EDO,
        initialInvestment: 1000,
        firstYearRate: 5.35,
        expectedInflation: 3.2,
        expectedNbpRate: 3.75,
        margin: 2,
        duration: 10,
        earlyWithdrawalFee: 2,
        taxRate: 19,
        isCapitalized: true,
        payoutFrequency: InterestPayout.MATURITY,
        purchaseDate: '2026-06-01',
        withdrawalDate: '2036-06-01',
        isRebought: false,
        rebuyDiscount: 0,
        taxStrategy: TaxStrategy.STANDARD,
      },
    };
    vi.mocked(apiPost).mockResolvedValueOnce({
      shareId: 'abc',
      shareUrl: 'https://example.com/shared-scenarios/abc',
    });

    await scenarioShareClient.createSingleScenario(payload);

    expect(apiPost).toHaveBeenCalledWith('/api/scenarios/share', payload);
  });
});
