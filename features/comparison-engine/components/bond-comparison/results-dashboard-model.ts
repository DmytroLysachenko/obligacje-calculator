import type { BondComparisonScenarioItem } from '@/features/bond-core/types/scenarios';

export function getModeledValue(result: BondComparisonScenarioItem, showRealValue: boolean) {
  return showRealValue ? result.result.finalRealValue : result.result.netPayoutValue;
}

export function sortResultsByModeledValue(
  results: BondComparisonScenarioItem[],
  showRealValue: boolean,
) {
  return [...results].sort(
    (left, right) => getModeledValue(right, showRealValue) - getModeledValue(left, showRealValue),
  );
}

export function getRunnerUpResult(
  rankedResults: BondComparisonScenarioItem[],
  leadingResult: BondComparisonScenarioItem,
) {
  return rankedResults.find((result) => result.type !== leadingResult.type);
}

export function buildComparisonVerdictModel({
  results,
  leadingResult,
  showRealValue,
}: {
  results: BondComparisonScenarioItem[];
  leadingResult: BondComparisonScenarioItem;
  showRealValue: boolean;
}) {
  const rankedResults = sortResultsByModeledValue(results, showRealValue);
  const runnerUp = getRunnerUpResult(rankedResults, leadingResult);
  const leadingValue = getModeledValue(leadingResult, showRealValue);
  const runnerUpValue = runnerUp ? getModeledValue(runnerUp, showRealValue) : undefined;
  const spread = runnerUpValue !== undefined ? leadingValue - runnerUpValue : undefined;

  return {
    rankedResults,
    runnerUp,
    leadingValue,
    runnerUpValue,
    spread,
  };
}
