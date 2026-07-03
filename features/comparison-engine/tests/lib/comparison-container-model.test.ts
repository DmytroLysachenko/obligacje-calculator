import { describe, expect, it } from 'vitest';

import { BOND_DEFINITIONS } from '@/features/bond-core/constants/bond-definitions';
import { BondType } from '@/features/bond-core/types';

import {
  buildDefaultSharedConfig,
  buildScenarioInputs,
  DEFAULT_SCENARIO_A,
  DEFAULT_SCENARIO_B,
} from '../../lib/comparison-calculator-state';
import { buildComparisonContainerViewModel } from '../../lib/comparison-container-model';

const t = (key: string) => key;

describe('comparison container model', () => {
  it('uses committed result inputs for result rendering state', () => {
    const sharedConfig = buildDefaultSharedConfig();
    const inputsA = buildScenarioInputs(sharedConfig, DEFAULT_SCENARIO_A, BOND_DEFINITIONS);
    const inputsB = buildScenarioInputs(sharedConfig, DEFAULT_SCENARIO_B, BOND_DEFINITIONS);
    const committedInputsA = { ...inputsA, withdrawalDate: '2030-01-01' };
    const committedInputsB = { ...inputsB, withdrawalDate: '2031-01-01' };

    const model = buildComparisonContainerViewModel({
      inputsA,
      inputsB,
      committedInputsA,
      committedInputsB,
      resultsA: null,
      resultsB: null,
      scenarioABondType: BondType.EDO,
      scenarioBBondType: BondType.ROR,
      definitions: BOND_DEFINITIONS,
      language: 'en',
      t,
      chartStep: 'yearly',
    });

    expect(model.resultInputsA).toBe(committedInputsA);
    expect(model.resultInputsB).toBe(committedInputsB);
    expect(model.chartData).toEqual([]);
    expect(model.assumptionsBondType).toBe(BondType.EDO);
    expect(model.durationMismatch).toBe(true);
    expect(model.scenarioAColor).toBeTruthy();
    expect(model.scenarioBColor).toBeTruthy();
  });
});
