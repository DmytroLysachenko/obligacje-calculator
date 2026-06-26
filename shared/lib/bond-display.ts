'use client';
import { differenceInMonths } from 'date-fns';

import { YearlyTimelinePoint } from '@/features/bond-core/types';
import { SimulationEventType } from '@/features/bond-core/types/simulation';
import { translateMessage } from '@/i18n/translate';

import type { AppLanguage } from './bond-display-labels';
import {
  formatMonthYear,
  getCadenceDisplayLabel,
  getCashFlowDisplayLabel,
  getCycleDisplayLabel,
  getProjectionDisplayLabel,
  getRateSourceDisplayLabel,
  getReferenceDisplayLabel,
  getSimulationEventDisplayLabel,
  getValueMeaningLabel,
  inferCashFlowSemantics,
} from './bond-display-labels';
import { densifyTimelinePoints } from './bond-display-timeline';

export type { AppLanguage } from './bond-display-labels';
export {
  getRateSourceDisplayLabel,
  getReferenceDisplayLabel,
  getSimulationEventDisplayLabel,
} from './bond-display-labels';
export interface BondTimelineDisplayRow {
  key: string;
  periodLabel: string;
  cadenceLabel: string;
  cycleLabel: string;
  valueMeaningLabel: string;
  cashFlowLabel: string;
  interestRateLabel: string;
  rateSourceLabel: string;
  referenceLabel?: string;
  eventLabels: string[];
  projectionLabel?: string;
  principalValue: number;
  paidOutCash: number;
  totalWealth: number;
  netProfit: number;
  realValue: number;
  earlyExitValue: number;
  isWithdrawal: boolean;
}
export interface BondChartDisplayPoint {
  key: string;
  dateKey: string;
  xLabel: string;
  nominal: number;
  real: number;
  inflation?: number;
  nbp?: number;
  low?: number;
  high?: number;
  isProjected: boolean;
  isMaturity: boolean;
  rateLabel: string;
  eventLabels: string[];
}
type ChartAggregationStep = 'daily' | 'monthly' | 'quarterly' | 'yearly';
interface NormalizedBondDisplayPoint extends BondChartDisplayPoint {
  interestRate?: number;
}
export function getAuditTimelinePoint(timeline: YearlyTimelinePoint[]) {
  return (
    timeline.find(
      (point) =>
        point.events?.some((event) => event.type !== SimulationEventType.PURCHASE) ||
        point.netInterest !== 0 ||
        point.accumulatedNetInterest !== 0 ||
        point.isWithdrawal ||
        point.isMaturity,
    ) ?? timeline[0]
  );
}
export function buildBondTimelineDisplayRows(
  timeline: YearlyTimelinePoint[],
  language: AppLanguage,
  chartStep: ChartAggregationStep = 'yearly',
): BondTimelineDisplayRow[] {
  const effectiveTimeline = densifyTimelinePoints(timeline, chartStep);
  const cashFlowSemantics = inferCashFlowSemantics(timeline);
  const cashFlowLabel = getCashFlowDisplayLabel(cashFlowSemantics, language);
  return effectiveTimeline.map((point) => ({
    key: `${point.cycleIndex}-${point.periodLabel}-${point.cycleEndDate}`,
    periodLabel: formatMonthYear(point.cycleEndDate, language),
    cadenceLabel: point.events?.length
      ? getCadenceDisplayLabel(point, language)
      : translateMessage(language, 'bonds.timeline_display.cadence.checkpoint'),
    cycleLabel: getCycleDisplayLabel(point, language),
    valueMeaningLabel: getValueMeaningLabel(point, language, cashFlowSemantics),
    cashFlowLabel,
    interestRateLabel: `${point.interestRate.toFixed(2)}%`,
    rateSourceLabel: getRateSourceDisplayLabel(point.rateSource, language),
    referenceLabel: getReferenceDisplayLabel(point, language),
    eventLabels:
      point.events?.map((event) => getSimulationEventDisplayLabel(event.type, language)) ?? [],
    projectionLabel: getProjectionDisplayLabel(point.isProjected, language),
    principalValue: point.nominalValueAfterInterest,
    paidOutCash: point.accumulatedNetInterest,
    totalWealth: point.totalValue,
    netProfit: point.netProfit,
    realValue: point.realValue,
    earlyExitValue: point.earlyWithdrawalValue,
    isWithdrawal: point.isWithdrawal,
  }));
}
export function buildBondChartDisplayPoints(
  initialInvestment: number,
  timeline: YearlyTimelinePoint[],
  language: AppLanguage,
  comparisonScenarios?: {
    low: YearlyTimelinePoint[];
    high: YearlyTimelinePoint[];
  },
  chartStep: ChartAggregationStep = 'yearly',
): BondChartDisplayPoint[] {
  const normalizedTimeline = normalizeBondChartDisplayTimeline(
    timeline,
    language,
    comparisonScenarios,
    chartStep,
  );
  if (normalizedTimeline.length === 0) {
    return [];
  }
  return aggregateBondChartDisplayPoints(
    normalizedTimeline.map((point, index) =>
      index === 0
        ? {
            ...point,
            nominal: initialInvestment,
            real: initialInvestment,
            low: comparisonScenarios ? initialInvestment : undefined,
            high: comparisonScenarios ? initialInvestment : undefined,
            rateLabel: translateMessage(language, 'bonds.timeline_display.chart.initial_capital'),
          }
        : point,
    ),
    chartStep,
  );
}
export function normalizeBondChartDisplayTimeline(
  timeline: YearlyTimelinePoint[],
  language: AppLanguage,
  comparisonScenarios?: {
    low: YearlyTimelinePoint[];
    high: YearlyTimelinePoint[];
  },
  chartStep: ChartAggregationStep = 'yearly',
): NormalizedBondDisplayPoint[] {
  const effectiveTimeline = densifyTimelinePoints(timeline, chartStep);
  const effectiveLowTimeline = comparisonScenarios?.low
    ? densifyTimelinePoints(comparisonScenarios.low, chartStep)
    : undefined;
  const effectiveHighTimeline = comparisonScenarios?.high
    ? densifyTimelinePoints(comparisonScenarios.high, chartStep)
    : undefined;
  return effectiveTimeline.map((point, index) => ({
    key: `${point.cycleIndex}-${point.periodLabel}-${point.cycleEndDate}`,
    dateKey: point.cycleEndDate,
    xLabel: formatMonthYear(point.cycleEndDate, language),
    nominal: Number(point.totalValue.toFixed(2)),
    real: Number(point.realValue.toFixed(2)),
    inflation: point.inflationReference,
    nbp: point.nbpReference,
    low: effectiveLowTimeline?.[index]?.totalValue,
    high: effectiveHighTimeline?.[index]?.totalValue,
    isProjected: Boolean(point.isProjected),
    isMaturity: point.isMaturity,
    rateLabel: getRateSourceDisplayLabel(point.rateSource, language),
    interestRate: point.interestRate,
    eventLabels:
      point.events?.map((event) => getSimulationEventDisplayLabel(event.type, language)) ?? [],
  }));
}
function aggregateBondChartDisplayPoints(
  points: BondChartDisplayPoint[],
  chartStep: ChartAggregationStep,
) {
  if (chartStep === 'daily' || chartStep === 'monthly') {
    return points;
  }
  const groups = new Map<string, BondChartDisplayPoint[]>();
  const firstDate = points[0] ? new Date(points[0].dateKey) : null;
  for (const point of points) {
    const date = new Date(point.dateKey);
    const monthsFromStart = firstDate ? Math.max(0, differenceInMonths(date, firstDate)) : 0;
    const groupKey =
      chartStep === 'quarterly'
        ? `q-${Math.floor(monthsFromStart / 3)}`
        : `y-${Math.floor(monthsFromStart / 12)}`;
    const bucket = groups.get(groupKey) ?? [];
    bucket.push(point);
    groups.set(groupKey, bucket);
  }
  const aggregated = Array.from(groups.values()).map((bucket) => {
    const first = bucket[0];
    return {
      ...first,
      eventLabels: Array.from(new Set(bucket.flatMap((point) => point.eventLabels))),
      isProjected: bucket.some((point) => point.isProjected),
      isMaturity: bucket.some((point) => point.isMaturity),
    };
  });
  const terminal = points.at(-1);
  if (terminal && aggregated.at(-1)?.dateKey !== terminal.dateKey) {
    aggregated.push(terminal);
  }
  return aggregated;
}
