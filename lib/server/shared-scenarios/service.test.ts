import { describe, expect, it, vi } from 'vitest';

const repository = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('./repository', () => ({
  createSharedSingleScenarioRecord: repository.create,
  findSharedSingleScenarioRecord: vi.fn(),
}));

vi.mock('@/lib/site-url', () => ({
  getCanonicalUrl: (path: string) => `https://canonical.example${path}`,
}));

describe('shared scenario service', () => {
  it('returns a configured canonical URL rather than a caller controlled origin', async () => {
    repository.create.mockResolvedValue({ shareId: '123e4567-e89b-12d3-a456-426614174000' });
    const { createSharedSingleScenario } = await import('./service');
    const result = await createSharedSingleScenario({
      inputs: {
        bondType: 'EDO', initialInvestment: 1000, firstYearRate: 5, expectedInflation: 3,
        margin: 2, duration: 10, earlyWithdrawalFee: 2, taxRate: 19, isCapitalized: true,
        payoutFrequency: 'MATURITY', purchaseDate: '2026-01-01', withdrawalDate: '2036-01-01',
        isRebought: false, rebuyDiscount: 0, taxStrategy: 'STANDARD',
      },
    });
    expect(result.shareUrl).toBe('https://canonical.example/shared-scenarios/123e4567-e89b-12d3-a456-426614174000');
  });
});
