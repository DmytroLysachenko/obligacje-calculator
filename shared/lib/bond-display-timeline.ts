import { addMonths, differenceInMonths } from 'date-fns';

import { YearlyTimelinePoint } from '@/features/bond-core/types';

type ChartAggregationStep = 'daily' | 'monthly' | 'quarterly' | 'yearly';

function interpolateValue(start: number | undefined, end: number | undefined, progress: number) {
  if (start === undefined && end === undefined) {
    return undefined;
  }
  if (start === undefined) {
    return end;
  }
  if (end === undefined) {
    return start;
  }
  return Number((start + (end - start) * progress).toFixed(2));
}

function carryForwardValue<T>(start: T | undefined, end: T | undefined) {
  if (start !== undefined) {
    return start;
  }
  return end;
}

export function densifyTimelinePoints(
  points: YearlyTimelinePoint[],
  chartStep: ChartAggregationStep,
): YearlyTimelinePoint[] {
  if (chartStep === 'daily' || chartStep === 'yearly' || points.length <= 1) {
    return points;
  }
  const stepMonths = chartStep === 'monthly' ? 1 : 3;
  const densified: YearlyTimelinePoint[] = [points[0]];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const previousDate = new Date(previous.cycleEndDate);
    const currentDate = new Date(current.cycleEndDate);
    const totalMonths = differenceInMonths(currentDate, previousDate);
    if (totalMonths <= stepMonths) {
      densified.push(current);
      continue;
    }
    for (let offset = stepMonths; offset < totalMonths; offset += stepMonths) {
      const checkpointDate = addMonths(previousDate, offset);
      const progress = offset / totalMonths;
      densified.push({
        ...current,
        cycleEndDate: checkpointDate.toISOString(),
        periodLabel: current.periodLabel,
        interestRate:
          carryForwardValue(previous.interestRate, current.interestRate) ?? current.interestRate,
        nominalValueBeforeInterest:
          interpolateValue(
            previous.nominalValueBeforeInterest,
            current.nominalValueBeforeInterest,
            progress,
          ) ?? current.nominalValueBeforeInterest,
        interestEarned:
          interpolateValue(previous.interestEarned, current.interestEarned, progress) ??
          current.interestEarned,
        taxDeducted:
          interpolateValue(previous.taxDeducted, current.taxDeducted, progress) ??
          current.taxDeducted,
        netInterest:
          interpolateValue(previous.netInterest, current.netInterest, progress) ??
          current.netInterest,
        nominalValueAfterInterest:
          interpolateValue(
            previous.nominalValueAfterInterest,
            current.nominalValueAfterInterest,
            progress,
          ) ?? current.nominalValueAfterInterest,
        accumulatedNetInterest:
          interpolateValue(
            previous.accumulatedNetInterest,
            current.accumulatedNetInterest,
            progress,
          ) ?? current.accumulatedNetInterest,
        totalValue:
          interpolateValue(previous.totalValue, current.totalValue, progress) ?? current.totalValue,
        realValue:
          interpolateValue(previous.realValue, current.realValue, progress) ?? current.realValue,
        netProfit:
          interpolateValue(previous.netProfit, current.netProfit, progress) ?? current.netProfit,
        earlyWithdrawalValue:
          interpolateValue(previous.earlyWithdrawalValue, current.earlyWithdrawalValue, progress) ??
          current.earlyWithdrawalValue,
        cumulativeInflation:
          interpolateValue(previous.cumulativeInflation, current.cumulativeInflation, progress) ??
          current.cumulativeInflation,
        inflationReference: carryForwardValue(
          previous.inflationReference,
          current.inflationReference,
        ),
        nbpReference: carryForwardValue(previous.nbpReference, current.nbpReference),
        rateSource:
          carryForwardValue(previous.rateSource, current.rateSource) ?? current.rateSource,
        rateReferenceValue: carryForwardValue(
          previous.rateReferenceValue,
          current.rateReferenceValue,
        ),
        rateMarginApplied: carryForwardValue(previous.rateMarginApplied, current.rateMarginApplied),
        events: [],
        isMaturity: false,
        isWithdrawal: false,
        usedProjectedRate: previous.usedProjectedRate || current.usedProjectedRate,
        isProjected: previous.isProjected || current.isProjected,
      });
    }
    densified.push(current);
  }
  return densified;
}
