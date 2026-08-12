import { describe, expect, it, vi } from 'vitest';

import { BOND_DEFINITIONS } from './constants/bond-definitions';
import { CalculationContextProvider } from './calculation-context';

describe('CalculationContextProvider', () => {
  it('loads independent authoritative values concurrently', async () => {
    let resolveFreshness!: () => void;
    let resolveDefinitions!: () => void;
    const freshness = new Promise<{ status: 'fresh'; usedFallback: false }>((resolve) => {
      resolveFreshness = () => resolve({ status: 'fresh', usedFallback: false });
    });
    const definitions = new Promise<typeof BOND_DEFINITIONS>((resolve) => {
      resolveDefinitions = () => resolve(BOND_DEFINITIONS);
    });
    const dependencies = {
      getDataFreshness: vi.fn(() => freshness),
      getDefinitions: vi.fn(() => definitions),
      getTaxRulesRevision: vi.fn(async () => 'tax:2026-08'),
    };

    const loading = new CalculationContextProvider(dependencies).load();
    expect(dependencies.getDataFreshness).toHaveBeenCalledOnce();
    expect(dependencies.getDefinitions).toHaveBeenCalledOnce();
    expect(dependencies.getTaxRulesRevision).toHaveBeenCalledOnce();

    resolveFreshness();
    resolveDefinitions();
    await expect(loading).resolves.toMatchObject({
      dataFreshness: { status: 'fresh', usedFallback: false },
      dbDefinitions: BOND_DEFINITIONS,
      taxRulesRevision: 'tax:2026-08',
      cacheRevision: JSON.stringify({
        dataFreshness: { status: 'fresh', usedFallback: false },
        taxRulesRevision: 'tax:2026-08',
      }),
    });
  });

  it('changes cache identity when either authoritative revision changes', async () => {
    const makeProvider = (taxRulesRevision: string, coverageAsOf: string) =>
      new CalculationContextProvider({
        getDataFreshness: async () => ({ status: 'fresh', usedFallback: false, coverageAsOf }),
        getDefinitions: async () => BOND_DEFINITIONS,
        getTaxRulesRevision: async () => taxRulesRevision,
      });

    const baseline = await makeProvider('tax:1', '2026-08-01').load();
    const changedTax = await makeProvider('tax:2', '2026-08-01').load();
    const changedData = await makeProvider('tax:1', '2026-08-02').load();

    expect(changedTax.cacheRevision).not.toBe(baseline.cacheRevision);
    expect(changedData.cacheRevision).not.toBe(baseline.cacheRevision);
  });
});
