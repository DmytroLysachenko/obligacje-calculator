import { describe, expect, it } from 'vitest';

import { TaxStrategy } from '@/features/bond-core/types';

import {
  applyOptimizerMacroDefaults,
  buildDefaultOptimizerInputs,
  buildOptimizerReadySteps,
  formatOptimizerHorizonYears,
  isOptimizerMacroKey,
  updateOptimizerInput,
} from '../../lib/optimizer-state';

describe('optimizer state model', () => {
  it('builds stable defaults from the supplied date', () => {
    expect(buildDefaultOptimizerInputs(new Date('2026-06-16T00:00:00.000Z'))).toEqual({
      initialInvestment: 10000,
      investmentHorizonMonths: 48,
      purchaseDate: '2026-06-16',
      expectedInflation: 3.5,
      expectedNbpRate: 5.25,
      taxStrategy: TaxStrategy.STANDARD,
      includeFamilyBonds: false,
    });
  });

  it('applies macro defaults only before the user touches macro assumptions', () => {
    const inputs = buildDefaultOptimizerInputs(new Date('2026-06-16T00:00:00.000Z'));

    expect(
      applyOptimizerMacroDefaults(
        inputs,
        {
          expectedInflation: 3.2,
          expectedNbpRate: 3.75,
        },
        false,
      ),
    ).toMatchObject({
      expectedInflation: 3.2,
      expectedNbpRate: 3.75,
    });
    expect(
      applyOptimizerMacroDefaults(
        inputs,
        {
          expectedInflation: 3.2,
          expectedNbpRate: 3.75,
        },
        true,
      ),
    ).toBe(inputs);
  });

  it('identifies macro updates and formats horizons', () => {
    expect(isOptimizerMacroKey('expectedInflation')).toBe(true);
    expect(isOptimizerMacroKey('initialInvestment')).toBe(false);
    expect(formatOptimizerHorizonYears(54)).toBe('4.5');
  });

  it('updates typed input values without changing other fields', () => {
    const inputs = buildDefaultOptimizerInputs(new Date('2026-06-16T00:00:00.000Z'));
    const updated = updateOptimizerInput(inputs, 'includeFamilyBonds', true);

    expect(updated).toMatchObject({
      ...inputs,
      includeFamilyBonds: true,
    });
  });

  it('builds ready-state steps from caller-provided labels', () => {
    expect(
      buildOptimizerReadySteps({
        amount: 'PLN 10,000',
        months: 48,
        labels: {
          amountTitle: 'Amount',
          amountDescription: (amount) => `Invest ${amount}`,
          horizonTitle: 'Horizon',
          horizonDescription: (months) => `${months} months`,
          scopeTitle: 'Scope',
          scopeDescription: 'Standard bonds',
        },
      }),
    ).toEqual([
      { id: 'amount', title: 'Amount', description: 'Invest PLN 10,000' },
      { id: 'horizon', title: 'Horizon', description: '48 months' },
      { id: 'narrow-scope', title: 'Scope', description: 'Standard bonds' },
    ]);
  });
});
