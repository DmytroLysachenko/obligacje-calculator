import { BondInputs, BondType } from '@/features/bond-core/types';
import { ScenarioKind, SingleBondCalculationEnvelope } from '@/features/bond-core/types/scenarios';
import { bondSeriesClient } from '@/shared/lib/bond-series-client';
import { getCalculationEndpoint } from '@/shared/lib/calculation-endpoints';

import {
  applyReverseSavingsGoal,
  getReverseCalculationTestInputs,
} from './single-calculator-state';

type PostCalculation = <TResponse>(
  endpoint: string,
  payload: unknown,
  options?: { preferWorker?: boolean },
) => Promise<TResponse>;

export function isCalculationAbort(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' || error.message === 'Calculation aborted')
  );
}

export async function runSingleBondCalculation({
  inputs,
  post,
}: {
  inputs: BondInputs;
  post: PostCalculation;
}) {
  let finalInputs = { ...inputs };

  if (inputs.calculatorMode === 'reverse' && inputs.savingsGoal) {
    const simulatedEnvelope = await post<SingleBondCalculationEnvelope>(
      getCalculationEndpoint(ScenarioKind.SINGLE_BOND),
      getReverseCalculationTestInputs(inputs),
      { preferWorker: true },
    );
    finalInputs = applyReverseSavingsGoal(inputs, simulatedEnvelope.result.netPayoutValue);
  }

  const envelope = await post<SingleBondCalculationEnvelope>(
    getCalculationEndpoint(ScenarioKind.SINGLE_BOND),
    finalInputs,
    { preferWorker: true },
  );

  return { envelope, finalInputs };
}

export function fetchBondSeriesForSymbol(symbol: BondType) {
  return bondSeriesClient.listBySymbol(symbol);
}
