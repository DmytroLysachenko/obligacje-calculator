import { describe, expect, it } from 'vitest';

import { TaxStrategy } from '@/features/bond-core/types';

import {
  applyOptimizerClientInputUpdate,
  buildOptimizerTaxStrategyLabels,
  getOptimizerClientViewState,
} from '../../lib/optimizer-client-state';
import { buildDefaultOptimizerInputs } from '../../lib/optimizer-state';

describe('optimizer client state', () => {
  it('applies input updates and reports macro assumption touches', () => {
    const inputs = buildDefaultOptimizerInputs(new Date('2026-06-16T00:00:00.000Z'));
    const macroUpdate = applyOptimizerClientInputUpdate(inputs, 'expectedInflation', 4.1);
    const amountUpdate = applyOptimizerClientInputUpdate(inputs, 'initialInvestment', 15_000);

    expect(macroUpdate).toMatchObject({
      inputs: { expectedInflation: 4.1 },
      touchedMacroAssumptions: true,
    });
    expect(amountUpdate).toMatchObject({
      inputs: { initialInvestment: 15000 },
      touchedMacroAssumptions: false,
    });
  });

  it('derives view state from inputs and optional envelope', () => {
    const inputs = {
      ...buildDefaultOptimizerInputs(new Date('2026-06-16T00:00:00.000Z')),
      investmentHorizonMonths: 54,
    };

    expect(getOptimizerClientViewState({ inputs, envelope: null })).toMatchObject({
      results: undefined,
      leadingScenario: undefined,
      horizonYears: '4.5',
      hasResults: false,
    });
  });

  it('builds tax strategy labels keyed by domain enum', () => {
    expect(
      buildOptimizerTaxStrategyLabels({
        standard: 'Standard',
        ike: 'IKE',
        ikze: 'IKZE',
      }),
    ).toEqual({
      [TaxStrategy.STANDARD]: 'Standard',
      [TaxStrategy.IKE]: 'IKE',
      [TaxStrategy.IKZE]: 'IKZE',
    });
  });
});
