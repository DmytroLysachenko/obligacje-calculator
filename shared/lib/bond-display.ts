'use client';
import { RateSource, YearlyTimelinePoint } from '@/features/bond-core/types';
import { SimulationEventType } from '@/features/bond-core/types/simulation';
import { t } from '@/i18n';
import { getIntlLocale } from '@/i18n/locale-utils';
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
    return t(RATE_SOURCE_KEYS[source], undefined, language);
}
export function getSimulationEventDisplayLabel(type: SimulationEventType, language: AppLanguage) {
    return t(EVENT_LABEL_KEYS[type], undefined, language);
}
export function getProjectionDisplayLabel(isProjected: boolean | undefined, language: AppLanguage) {
    if (!isProjected) {
        return undefined;
    }
    return t('bonds.timeline_display.projection.projected', undefined, language);
}
export function getCadenceDisplayLabel(point: YearlyTimelinePoint, language: AppLanguage) {
    if (point.events?.some((event) => event.type === SimulationEventType.PURCHASE)
        && point.events.length === 1) {
        return t('bonds.timeline_display.cadence.scenario_entry', undefined, language);
    }
    if (point.isMaturity) {
        return t('bonds.timeline_display.cadence.maturity_closeout', undefined, language);
    }
    if (point.isWithdrawal) {
        return t('bonds.timeline_display.cadence.exit_payout', undefined, language);
    }
    if (point.events?.some((event) => event.type === SimulationEventType.PAYOUT)) {
        return t('bonds.timeline_display.cadence.payout_rollover', undefined, language);
    }
    return t('bonds.timeline_display.cadence.checkpoint', undefined, language);
}
function inferCashFlowSemantics(timeline: YearlyTimelinePoint[]): CashFlowSemantics {
    return timeline.some((point) => point.events?.some((event) => event.type === SimulationEventType.PAYOUT))
        ? 'payout'
        : 'retained';
}
export function getCashFlowDisplayLabel(semantics: CashFlowSemantics, language: AppLanguage) {
    return t(semantics === 'payout'
        ? 'bonds.timeline_display.cash_flow.paid_out'
        : 'bonds.timeline_display.cash_flow.retained', undefined, language);
}
export function getCycleDisplayLabel(point: YearlyTimelinePoint, language: AppLanguage) {
    const start = formatMonthYear(point.cycleStartDate, language);
    const end = formatMonthYear(point.cycleEndDate, language);
    return `${t('bonds.cycle', undefined, language)} ${point.cycleIndex}: ${start} -> ${end}`;
}
export function getValueMeaningLabel(point: YearlyTimelinePoint, language: AppLanguage, cashFlowSemantics: CashFlowSemantics) {
    if (point.isWithdrawal) {
        return t('bonds.timeline_display.value_meaning.withdrawal', undefined, language);
    }
    if (point.isMaturity) {
        return t('bonds.timeline_display.value_meaning.maturity', undefined, language);
    }
    if (point.accumulatedNetInterest > 0) {
        return t(cashFlowSemantics === 'payout'
            ? 'bonds.timeline_display.value_meaning.paid_out_cash'
            : 'bonds.timeline_display.value_meaning.retained_interest', undefined, language);
    }
    return t('bonds.timeline_display.value_meaning.default', undefined, language);
}
export function getReferenceDisplayLabel(point: YearlyTimelinePoint, language: AppLanguage) {
    if (point.rateReferenceValue === undefined &&
        point.rateMarginApplied === undefined) {
        return undefined;
    }
    const referencePart = point.rateReferenceValue !== undefined
        ? t('bonds.timeline_display.reference.base', { value: point.rateReferenceValue.toFixed(2) }, language)
        : undefined;
    const marginPart = point.rateMarginApplied !== undefined
        ? t('bonds.timeline_display.reference.margin', { value: point.rateMarginApplied.toFixed(2) }, language)
        : undefined;
    return [referencePart, marginPart].filter(Boolean).join(' | ');
}
export function buildBondTimelineDisplayRows(timeline: YearlyTimelinePoint[], language: AppLanguage): BondTimelineDisplayRow[] {
    const cashFlowSemantics = inferCashFlowSemantics(timeline);
    const cashFlowLabel = getCashFlowDisplayLabel(cashFlowSemantics, language);
    return timeline.map((point) => ({
        key: `${point.cycleIndex}-${point.periodLabel}-${point.cycleEndDate}`,
        periodLabel: point.periodLabel,
        cadenceLabel: getCadenceDisplayLabel(point, language),
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
    const normalizedTimeline = normalizeBondChartDisplayTimeline(timeline, language, comparisonScenarios);
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
            rateLabel: t('bonds.timeline_display.chart.initial_capital', undefined, language),
        }
        : point), chartStep);
}
export function normalizeBondChartDisplayTimeline(timeline: YearlyTimelinePoint[], language: AppLanguage, comparisonScenarios?: {
    low: YearlyTimelinePoint[];
    high: YearlyTimelinePoint[];
}): NormalizedBondDisplayPoint[] {
    return timeline.map((point, index) => ({
        key: `${point.cycleIndex}-${point.periodLabel}-${point.cycleEndDate}`,
        dateKey: point.cycleEndDate,
        xLabel: formatMonthYear(point.cycleEndDate, language),
        nominal: Number(point.totalValue.toFixed(2)),
        real: Number(point.realValue.toFixed(2)),
        inflation: point.inflationReference,
        nbp: point.nbpReference,
        low: comparisonScenarios?.low[index]?.totalValue,
        high: comparisonScenarios?.high[index]?.totalValue,
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
    for (const point of points) {
        const date = new Date(point.dateKey);
        const groupKey = chartStep === 'quarterly'
            ? `${date.getUTCFullYear()}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`
            : `${date.getUTCFullYear()}`;
        const bucket = groups.get(groupKey) ?? [];
        bucket.push(point);
        groups.set(groupKey, bucket);
    }
    const aggregated = Array.from(groups.values()).map((bucket) => {
        const last = bucket[bucket.length - 1];
        return {
            ...last,
            eventLabels: Array.from(new Set(bucket.flatMap((point) => point.eventLabels))),
            isProjected: bucket.some((point) => point.isProjected),
            isMaturity: bucket.some((point) => point.isMaturity),
        };
    });
    return aggregated;
}

