import type { BondDefinition } from '../constants/bond-definitions';
import type { BondInputs } from '../types';
import type { BondComparisonScenarioItem } from '../types/scenarios';
import { calculateBondInvestment } from '../utils/calculations';

import { shouldAutoRollover } from './rollover';

export function calculateComparisonScenarioItem({
  inputs,
  definition,
  expectedInflation,
  scenarioKey,
}: {
  inputs: BondInputs;
  definition: BondDefinition;
  expectedInflation: BondInputs['expectedInflation'];
  scenarioKey?: BondComparisonScenarioItem['scenarioKey'];
}): BondComparisonScenarioItem {
  const rollover = shouldAutoRollover(inputs, definition.duration);

  return {
    scenarioKey,
    type: inputs.bondType,
    name: definition.fullName.en,
    result: calculateBondInvestment({
      ...inputs,
      expectedInflation,
      rollover,
    } as BondInputs & { rollover: boolean }),
  };
}
