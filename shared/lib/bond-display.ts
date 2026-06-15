'use client';
import { RateSource, YearlyTimelinePoint } from '@/features/bond-core/types';
import { SimulationEventType } from '@/features/bond-core/types/simulation';
import { getIntlLocale } from '@/i18n/locale-utils';
import { translateMessage } from '@/i18n/translate';
import { addMonths, differenceInMonths } from 'date-fns';
export type AppLanguage = 'pl' | 'en';
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
type CashFlowSemantics = 'payout' | 'retained';
export function getAuditTimelinePoint(timeline: YearlyTimelinePoint[]) {
    return (timeline.find((point) => point.events?.some((event) => event.type !== SimulationEventType.PURCHASE)
        || point.netInterest !== 0
        || point.accumulatedNetInterest !== 0
        || point.isWithdrawal
        || point.isMaturity) ?? timeline[0]);
}
function formatMonthYear(date: string, language: AppLanguage) {
    return new Intl.DateTimeFormat(getIntlLocale(language), {
        month: 'short',
        year: 'numeric',
    }).format(new Date(date));
}
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
    return Number((start + ((end - start) * progress)).toFixed(2));
}
function carryForwardValue<T>(start: T | undefined, end: T | undefined) {
    if (start !== undefined) {
        return start;
    }
    return end;
}
function densifyTimelinePoints(points: YearlyTimelinePoint[], chartStep: ChartAggregationStep): YearlyTimelinePoint[] {
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
                interestRate: carryForwardValue(previous.interestRate, current.interestRate) ?? current.interestRate,
                nominalValueBeforeInterest: interpolateValue(previous.nominalValueBeforeInterest, current.nominalValueBeforeInterest, progress) ?? current.nominalValueBeforeInterest,
                interestEarned: interpolateValue(previous.interestEarned, current.interestEarned, progress) ?? current.interestEarned,
                taxDeducted: interpolateValue(previous.taxDeducted, current.taxDeducted, progress) ?? current.taxDeducted,
                netInterest: interpolateValue(previous.netInterest, current.netInterest, progress) ?? current.netInterest,
                nominalValueAfterInterest: interpolateValue(previous.nominalValueAfterInterest, current.nominalValueAfterInterest, progress) ?? current.nominalValueAfterInterest,
                accumulatedNetInterest: interpolateValue(previous.accumulatedNetInterest, current.accumulatedNetInterest, progress) ?? current.accumulatedNetInterest,
                totalValue: interpolateValue(previous.totalValue, current.totalValue, progress) ?? current.totalValue,
                realValue: interpolateValue(previous.realValue, current.realValue, progress) ?? current.realValue,
                netProfit: interpolateValue(previous.netProfit, current.netProfit, progress) ?? current.netProfit,
                earlyWithdrawalValue: interpolateValue(previous.earlyWithdrawalValue, current.earlyWithdrawalValue, progress) ?? current.earlyWithdrawalValue,
                cumulativeInflation: interpolateValue(previous.cumulativeInflation, current.cumulativeInflation, progress) ?? current.cumulativeInflation,
                inflationReference: carryForwardValue(previous.inflationReference, current.inflationReference),
                nbpReference: carryForwardValue(previous.nbpReference, current.nbpReference),
                rateSource: carryForwardValue(previous.rateSource, current.rateSource) ?? current.rateSource,
                rateReferenceValue: carryForwardValue(previous.rateReferenceValue, current.rateReferenceValue),
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
const RATE_SOURCE_KEYS: Record<RateSource, string> = {
    initial_principal: 'bonds.timeline_display.rate_source.initial_principal',
    fixed_rate: 'bonds.timeline_display.rate_source.fixed_rate',
    first_year_fixed: 'bonds.timeline_display.rate_source.first_year_fixed',
    historical_cpi_lag: 'bonds.timeline_display.rate_source.historical_cpi_lag',
    projected_cpi: 'bonds.timeline_display.rate_source.projected_cpi',
    historical_nbp: 'bonds.timeline_display.rate_source.historical_nbp',
    projected_nbp: 'bonds.timeline_display.rate_source.projected_nbp',
};
const EVENT_LABEL_KEYS: Record<SimulationEventType, string> = {
    PURCHASE: 'bonds.timeline_display.event.purchase',
    RATE_RESET: 'bonds.timeline_display.event.rate_reset',
    INTEREST_ACCRUAL: 'bonds.timeline_display.event.interest_accrual',
    PAYOUT: 'bonds.timeline_display.event.payout',
    TAX_SETTLEMENT: 'bonds.timeline_display.event.tax_settlement',
    EARLY_REDEMPTION_FEE: 'bonds.timeline_display.event.early_redemption_fee',
    ROLLOVER_PURCHASE: 'bonds.timeline_display.event.rollover_purchase',
    MATURITY: 'bonds.timeline_display.event.maturity',
    WITHDRAWAL: 'bonds.timeline_display.event.withdrawal',
};
export function getRateSourceDisplayLabel(source: RateSource, language: AppLanguage) {
    return translateMessage(language, RATE_SOURCE_KEYS[source]);
}
export function getSimulationEventDisplayLabel(type: SimulationEventType, language: AppLanguage) {
    return translateMessage(language, EVENT_LABEL_KEYS[type]);
}
export function getProjectionDisplayLabel(isProjected: boolean | undefined, language: AppLanguage) {
    if (!isProjected) {
        return undefined;
    }
    return translateMessage(language, 'bonds.timeline_display.projection.projected');
}
export function getCadenceDisplayLabel(point: YearlyTimelinePoint, language: AppLanguage) {
    if (point.events?.some((event) => event.type === SimulationEventType.PURCHASE)
        && point.events.length === 1) {
        return translateMessage(language, 'bonds.timeline_display.cadence.scenario_entry');
    }
    if (point.isMaturity) {
        return translateMessage(language, 'bonds.timeline_display.cadence.maturity_closeout');
    }
    if (point.isWithdrawal) {
        return translateMessage(language, 'bonds.timeline_display.cadence.exit_payout');
    }
    if (point.events?.some((event) => event.type === SimulationEventType.PAYOUT)) {
        return translateMessage(language, 'bonds.timeline_display.cadence.payout_rollover');
    }
    return translateMessage(language, 'bonds.timeline_display.cadence.checkpoint');
}
function inferCashFlowSemantics(timeline: YearlyTimelinePoint[]): CashFlowSemantics {
    return timeline.some((point) => point.events?.some((event) => event.type === SimulationEventType.PAYOUT))
        ? 'payout'
        : 'retained';
}
export function getCashFlowDisplayLabel(semantics: CashFlowSemantics, language: AppLanguage) {
    return translateMessage(language, semantics === 'payout'
        ? 'bonds.timeline_display.cash_flow.paid_out'
        : 'bonds.timeline_display.cash_flow.retained');
}
export function getCycleDisplayLabel(point: YearlyTimelinePoint, language: AppLanguage) {
    const start = formatMonthYear(point.cycleStartDate, language);
    const end = formatMonthYear(point.cycleEndDate, language);
    return `${translateMessage(language, 'bonds.cycle')} ${point.cycleIndex}: ${start} -> ${end}`;
}
export function getValueMeaningLabel(point: YearlyTimelinePoint, language: AppLanguage, cashFlowSemantics: CashFlowSemantics) {
    if (point.isWithdrawal) {
        return translateMessage(language, 'bonds.timeline_display.value_meaning.withdrawal');
    }
    if (point.isMaturity) {
        return translateMessage(language, 'bonds.timeline_display.value_meaning.maturity');
    }
    if (point.accumulatedNetInterest > 0) {
        return translateMessage(language, cashFlowSemantics === 'payout'
            ? 'bonds.timeline_display.value_meaning.paid_out_cash'
            : 'bonds.timeline_display.value_meaning.retained_interest');
    }
    return translateMessage(language, 'bonds.timeline_display.value_meaning.default');
}
export function getReferenceDisplayLabel(point: YearlyTimelinePoint, language: AppLanguage) {
    if (point.rateReferenceValue === undefined &&
        point.rateMarginApplied === undefined) {
        return undefined;
    }
    const referencePart = point.rateReferenceValue !== undefined
        ? translateMessage(language, 'bonds.timeline_display.reference.base', { value: point.rateReferenceValue.toFixed(2) })
        : undefined;
    const marginPart = point.rateMarginApplied !== undefined
        ? translateMessage(language, 'bonds.timeline_display.reference.margin', { value: point.rateMarginApplied.toFixed(2) })
        : undefined;
    return [referencePart, marginPart].filter(Boolean).join(' | ');
}
export function buildBondTimelineDisplayRows(timeline: YearlyTimelinePoint[], language: AppLanguage, chartStep: ChartAggregationStep = 'yearly'): BondTimelineDisplayRow[] {
    const effectiveTimeline = densifyTimelinePoints(timeline, chartStep);
    const cashFlowSemantics = inferCashFlowSemantics(timeline);
    const cashFlowLabel = getCashFlowDisplayLabel(cashFlowSemantics, language);
    return effectiveTimeline.map((point) => ({
        key: `${point.cycleIndex}-${point.periodLabel}-${point.cycleEndDate}`,
        periodLabel: formatMonthYear(point.cycleEndDate, language),
        cadenceLabel: point.events?.length ? getCadenceDisplayLabel(point, language) : translateMessage(language, 'bonds.timeline_display.cadence.checkpoint'),
        cycleLabel: getCycleDisplayLabel(point, language),
        valueMeaningLabel: getValueMeaningLabel(point, language, cashFlowSemantics),
        cashFlowLabel,
        interestRateLabel: `${point.interestRate.toFixed(2)}%`,
        rateSourceLabel: getRateSourceDisplayLabel(point.rateSource, language),
        referenceLabel: getReferenceDisplayLabel(point, language),
        eventLabels: point.events?.map((event) => getSimulationEventDisplayLabel(event.type, language)) ?? [],
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
export function buildBondChartDisplayPoints(initialInvestment: number, timeline: YearlyTimelinePoint[], language: AppLanguage, comparisonScenarios?: {
    low: YearlyTimelinePoint[];
    high: YearlyTimelinePoint[];
}, chartStep: ChartAggregationStep = 'yearly'): BondChartDisplayPoint[] {
    const normalizedTimeline = normalizeBondChartDisplayTimeline(timeline, language, comparisonScenarios, chartStep);
    if (normalizedTimeline.length === 0) {
        return [];
    }
    return aggregateBondChartDisplayPoints(normalizedTimeline.map((point, index) => index === 0
        ? {
            ...point,
            nominal: initialInvestment,
            real: initialInvestment,
            low: comparisonScenarios ? initialInvestment : undefined,
            high: comparisonScenarios ? initialInvestment : undefined,
            rateLabel: translateMessage(language, 'bonds.timeline_display.chart.initial_capital'),
        }
        : point), chartStep);
}
export function normalizeBondChartDisplayTimeline(timeline: YearlyTimelinePoint[], language: AppLanguage, comparisonScenarios?: {
    low: YearlyTimelinePoint[];
    high: YearlyTimelinePoint[];
}, chartStep: ChartAggregationStep = 'yearly'): NormalizedBondDisplayPoint[] {
    const effectiveTimeline = densifyTimelinePoints(timeline, chartStep);
    const effectiveLowTimeline = comparisonScenarios?.low ? densifyTimelinePoints(comparisonScenarios.low, chartStep) : undefined;
    const effectiveHighTimeline = comparisonScenarios?.high ? densifyTimelinePoints(comparisonScenarios.high, chartStep) : undefined;
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
        eventLabels: point.events?.map((event) => getSimulationEventDisplayLabel(event.type, language)) ?? [],
    }));
}
function aggregateBondChartDisplayPoints(points: BondChartDisplayPoint[], chartStep: ChartAggregationStep) {
    if (chartStep === 'daily' || chartStep === 'monthly') {
        return points;
    }
    const groups = new Map<string, BondChartDisplayPoint[]>();
    const firstDate = points[0] ? new Date(points[0].dateKey) : null;
    for (const point of points) {
        const date = new Date(point.dateKey);
        const monthsFromStart = firstDate ? Math.max(0, differenceInMonths(date, firstDate)) : 0;
        const groupKey = chartStep === 'quarterly'
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

