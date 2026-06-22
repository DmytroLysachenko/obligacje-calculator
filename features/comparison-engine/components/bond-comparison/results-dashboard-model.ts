import type { BondComparisonScenarioItem } from '@/features/bond-core/types/scenarios';

export function getModeledValue(
  result: BondComparisonScenarioItem,
  showRealValue: boolean,
) {
  return showRealValue
    ? result.result.finalRealValue
    : result.result.netPayoutValue;
}

export function sortResultsByModeledValue(
  results: BondComparisonScenarioItem[],
  showRealValue: boolean,
) {
  return [...results].sort(
    (left, right) =>
      getModeledValue(right, showRealValue) - getModeledValue(left, showRealValue),
  );
}

export function getRunnerUpResult(
  rankedResults: BondComparisonScenarioItem[],
  bestResult: BondComparisonScenarioItem,
) {
  return rankedResults.find((result) => result.type !== bestResult.type);
}

export function buildComparisonVerdictModel({
  results,
  bestResult,
  showRealValue,
}: {
  results: BondComparisonScenarioItem[];
  bestResult: BondComparisonScenarioItem;
  showRealValue: boolean;
}) {
  const rankedResults = sortResultsByModeledValue(results, showRealValue);
  const runnerUp = getRunnerUpResult(rankedResults, bestResult);
  const bestValue = getModeledValue(bestResult, showRealValue);
  const runnerUpValue = runnerUp
    ? getModeledValue(runnerUp, showRealValue)
    : undefined;
  const spread = runnerUpValue !== undefined
    ? bestValue - runnerUpValue
    : undefined;

  return {
    rankedResults,
    runnerUp,
    bestValue,
    runnerUpValue,
    spread,
  };
}
