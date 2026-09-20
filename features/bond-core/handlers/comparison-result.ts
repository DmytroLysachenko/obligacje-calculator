import type { BondDefinition } from '../constants/bond-definitions';
import type { BondInputs } from '../types';
import type { BondComparisonScenarioItem } from '../types/scenarios';
import { calculateBondInvestment } from '../utils/calculations';

import { shouldAutoRollover } from './rollover';

export function calculateComparisonScenarioItem({
  inputs,
  definition,
  expectedInflation,
  maturityMode,
  couponDisposition,
  scenarioKey,
}: {
  inputs: BondInputs;
  definition: BondDefinition;
  expectedInflation: BondInputs['expectedInflation'];
  maturityMode?:
    | 'hold_to_maturity'
    | 'reinvest_until_horizon'
    | 'cash_after_maturity'
    | 'align_to_shorter_duration';
  couponDisposition?: 'reinvest' | 'cash';
  scenarioKey?: BondComparisonScenarioItem['scenarioKey'];
}): BondComparisonScenarioItem {
  const rollover =
    maturityMode === 'reinvest_until_horizon'
      ? true
      : maturityMode === 'cash_after_maturity' || maturityMode === 'hold_to_maturity'
        ? false
        : shouldAutoRollover(inputs, definition.duration);

  return {
    scenarioKey,
    type: inputs.bondType,
    name: definition.fullName.en,
    strategyPolicy:
      maturityMode === 'cash_after_maturity' ||
      maturityMode === 'hold_to_maturity' ||
      maturityMode === 'reinvest_until_horizon'
        ? maturityMode
        : rollover
          ? 'reinvest_until_horizon'
          : 'hold_to_maturity',
    result: calculateBondInvestment({
      ...inputs,
      expectedInflation,
      rollover,
      couponDisposition,
    } as BondInputs & { rollover: boolean }),
  };
}
