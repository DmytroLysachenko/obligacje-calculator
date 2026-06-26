import { compareAsc, parseISO } from 'date-fns';

import { CalculationResult } from '@/features/bond-core/types';
import { SimulationEventType } from '@/features/bond-core/types/simulation';
import {
  AppLanguage,
  getRateSourceDisplayLabel,
  getSimulationEventDisplayLabel,
} from '@/shared/lib/bond-display';

export type ComparisonScenarioSnapshot = {
  nominalValue: number;
  realValue: number;
  netProfit: number;
  taxDeducted: number;
  interestRate?: number;
  rateSourceLabel?: string;
  eventLabels: string[];
};

function interpolateValue(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function interpolateTimelineNumber(
  previousValue: number | undefined,
  nextValue: number | undefined,
  fallback: number,
  progress: number,
) {
  if (
    typeof previousValue !== 'number' ||
    typeof nextValue !== 'number' ||
    !Number.isFinite(previousValue) ||
    !Number.isFinite(nextValue)
  ) {
    return fallback;
  }

  return interpolateValue(previousValue, nextValue, progress);
}

export function projectTimelineSnapshot(
  timeline: CalculationResult['timeline'],
  date: Date,
  initialInvestment: number,
  language: AppLanguage,
) {
  let currentSnapshot: ComparisonScenarioSnapshot = {
    nominalValue: initialInvestment,
    realValue: initialInvestment,
    netProfit: 0,
    taxDeducted: 0,
    eventLabels: [],
  };
  let index = 0;

  while (index < timeline.length && compareAsc(parseISO(timeline[index].cycleEndDate), date) <= 0) {
    const point = timeline[index];
    currentSnapshot = {
      nominalValue: point.totalValue,
      realValue: point.realValue ?? point.totalValue,
      netProfit: point.netProfit ?? point.totalValue - initialInvestment,
      taxDeducted: point.taxDeducted ?? 0,
      interestRate: point.interestRate,
      rateSourceLabel: point.rateSource
        ? getRateSourceDisplayLabel(point.rateSource, language)
        : undefined,
      eventLabels:
        point.events?.map((event) =>
          getSimulationEventDisplayLabel(event.type as SimulationEventType, language),
        ) ?? [],
    };
    index += 1;
  }

  const previousPoint = timeline[Math.max(0, index - 1)];
  const nextPoint = timeline[index];

  if (!previousPoint || !nextPoint) {
    return currentSnapshot;
  }

  const previousDate = parseISO(previousPoint.cycleEndDate);
  const nextDate = parseISO(nextPoint.cycleEndDate);
  const previousTime = previousDate.getTime();
  const nextTime = nextDate.getTime();
  const currentTime = date.getTime();

  if (nextTime <= previousTime || currentTime <= previousTime || currentTime >= nextTime) {
    return currentSnapshot;
  }

  const progress = (currentTime - previousTime) / (nextTime - previousTime);

  return {
    nominalValue: interpolateTimelineNumber(
      previousPoint.totalValue,
      nextPoint.totalValue,
      currentSnapshot.nominalValue,
      progress,
    ),
    realValue: interpolateTimelineNumber(
      previousPoint.realValue,
      nextPoint.realValue,
      currentSnapshot.realValue,
      progress,
    ),
    netProfit: interpolateTimelineNumber(
      previousPoint.netProfit,
      nextPoint.netProfit,
      currentSnapshot.netProfit,
      progress,
    ),
    taxDeducted: interpolateTimelineNumber(
      previousPoint.taxDeducted,
      nextPoint.taxDeducted,
      currentSnapshot.taxDeducted,
      progress,
    ),
    interestRate: currentSnapshot.interestRate,
    rateSourceLabel: currentSnapshot.rateSourceLabel,
    eventLabels: currentSnapshot.eventLabels,
  };
}
