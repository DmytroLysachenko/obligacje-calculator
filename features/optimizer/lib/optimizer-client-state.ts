import { TaxStrategy } from '@/features/bond-core/types';
import type { BondOptimizerCalculationEnvelope } from '@/features/bond-core/types/scenarios';

import {
  formatOptimizerHorizonYears,
  isOptimizerMacroKey,
  type OptimizerInputKey,
  type OptimizerInputs,
  updateOptimizerInput,
} from './optimizer-state';

export function applyOptimizerClientInputUpdate(
  inputs: OptimizerInputs,
  key: OptimizerInputKey,
  value: string | number | boolean,
) {
  return {
    inputs: updateOptimizerInput(inputs, key, value),
    touchedMacroAssumptions: isOptimizerMacroKey(key),
  };
}

export function getOptimizerClientViewState({
  inputs,
  envelope,
}: {
  inputs: OptimizerInputs;
  envelope: BondOptimizerCalculationEnvelope | null;
}) {
  const results = envelope?.result;

  return {
    results,
    leadingScenario: results?.highestPayout,
    horizonYears: formatOptimizerHorizonYears(inputs.investmentHorizonMonths),
    hasResults: Boolean(results),
  };
}

export function buildOptimizerTaxStrategyLabels(labels: {
  standard: string;
  ike: string;
  ikze: string;
}): Record<TaxStrategy, string> {
  return {
    [TaxStrategy.STANDARD]: labels.standard,
    [TaxStrategy.IKE]: labels.ike,
    [TaxStrategy.IKZE]: labels.ikze,
  };
}
