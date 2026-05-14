'use client';

import { RateSource, YearlyTimelinePoint } from '@/features/bond-core/types';
import { SimulationEventType } from '@/features/bond-core/types/simulation';

export type AppLanguage = 'pl' | 'en';

export interface BondTimelineDisplayRow {
  key: string;
  periodLabel: string;
  cadenceLabel: string;
  cycleLabel: string;
  valueMeaningLabel: string;
  interestRateLabel: string;
  rateSourceLabel: string;
  referenceLabel?: string;
  eventLabels: string[];
  projectionLabel?: string;
  nominalValue: number;
  netProfit: number;
  realValue: number;
  earlyExitValue: number;
  isWithdrawal: boolean;
}

export interface BondChartDisplayPoint {
  key: string;
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

function formatMonthYear(date: string, language: AppLanguage) {
  return new Intl.DateTimeFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

const RATE_SOURCE_LABELS: Record<AppLanguage, Record<RateSource, string>> = {
  en: {
    initial_principal: 'Initial principal context',
    fixed_rate: 'Fixed bond rate',
    first_year_fixed: 'First-year fixed rate',
    historical_cpi_lag: 'Historical CPI + margin',
    projected_cpi: 'Projected CPI + margin',
    historical_nbp: 'Historical NBP + margin',
    projected_nbp: 'Projected NBP + margin',
  },
  pl: {
    initial_principal: 'Kontekst kapitalu poczatkowego',
    fixed_rate: 'Stala stopa obligacji',
    first_year_fixed: 'Stala stopa pierwszego roku',
    historical_cpi_lag: 'Historyczny CPI + marza',
    projected_cpi: 'Prognozowany CPI + marza',
    historical_nbp: 'Historyczna stopa NBP + marza',
    projected_nbp: 'Prognozowana stopa NBP + marza',
  },
};

const EVENT_LABELS: Record<AppLanguage, Record<SimulationEventType, string>> = {
  en: {
    PURCHASE: 'Purchase',
    RATE_RESET: 'Rate reset',
    INTEREST_ACCRUAL: 'Interest accrual',
    PAYOUT: 'Payout',
    TAX_SETTLEMENT: 'Tax settlement',
    EARLY_REDEMPTION_FEE: 'Early fee',
    ROLLOVER_PURCHASE: 'Rollover purchase',
    MATURITY: 'Maturity',
    WITHDRAWAL: 'Withdrawal',
  },
  pl: {
    PURCHASE: 'Zakup',
    RATE_RESET: 'Reset stopy',
    INTEREST_ACCRUAL: 'Naliczenie odsetek',
    PAYOUT: 'Wyplata',
    TAX_SETTLEMENT: 'Rozliczenie podatku',
    EARLY_REDEMPTION_FEE: 'Oplata za wykup',
    ROLLOVER_PURCHASE: 'Zakup z odnowienia',
    MATURITY: 'Zapadalnosc',
    WITHDRAWAL: 'Wyjscie',
  },
};

export function getRateSourceDisplayLabel(source: RateSource, language: AppLanguage) {
  return RATE_SOURCE_LABELS[language][source];
}

export function getSimulationEventDisplayLabel(
  type: SimulationEventType,
  language: AppLanguage,
) {
  return EVENT_LABELS[language][type];
}

export function getProjectionDisplayLabel(
  isProjected: boolean | undefined,
  language: AppLanguage,
) {
  if (isProjected === undefined) {
    return undefined;
  }

  return isProjected
    ? language === 'pl'
      ? 'Prognoza'
      : 'Projected'
    : language === 'pl'
      ? 'Historia'
      : 'Historical';
}

export function getCadenceDisplayLabel(point: YearlyTimelinePoint, language: AppLanguage) {
  if (
    point.events?.some((event) => event.type === SimulationEventType.PURCHASE)
    && point.events.length === 1
  ) {
    return language === 'pl' ? 'Punkt wejscia do scenariusza' : 'Scenario entry point';
  }

  if (point.isMaturity) {
    return language === 'pl' ? 'Punkt zapadalnosci i zamkniecia cyklu' : 'Maturity close-out point';
  }

  if (point.isWithdrawal) {
    return language === 'pl' ? 'Punkt wyjscia z inwestycji' : 'Exit payout point';
  }

  if (point.events?.some((event) => event.type === SimulationEventType.PAYOUT)) {
    return language === 'pl' ? 'Punkt wyplaty lub odnowienia' : 'Payout or rollover point';
  }

  return language === 'pl' ? 'Kontrolny punkt scenariusza' : 'Scenario checkpoint';
}

export function getCycleDisplayLabel(point: YearlyTimelinePoint, language: AppLanguage) {
  const start = formatMonthYear(point.cycleStartDate, language);
  const end = formatMonthYear(point.cycleEndDate, language);

  return language === 'pl'
    ? `Cykl ${point.cycleIndex}: ${start} -> ${end}`
    : `Cycle ${point.cycleIndex}: ${start} -> ${end}`;
}

export function getValueMeaningLabel(point: YearlyTimelinePoint, language: AppLanguage) {
  if (point.isWithdrawal) {
    return language === 'pl'
      ? 'To jest wartosc przy wyjsciu po oplacie i podatku dla tego punktu.'
      : 'This row shows the exit value after modeled fees and tax at this point.';
  }

  if (point.isMaturity) {
    return language === 'pl'
      ? 'To jest punkt domkniecia pelnego cyklu obligacji.'
      : 'This row closes the full bond cycle.';
  }

  return language === 'pl'
    ? 'To jest punkt kontrolny pokazujacy wartosc po naliczeniu dla tego okresu.'
    : 'This is a checkpoint showing value after accrual for this period.';
}

export function getReferenceDisplayLabel(
  point: YearlyTimelinePoint,
  language: AppLanguage,
) {
  if (
    point.rateReferenceValue === undefined &&
    point.rateMarginApplied === undefined
  ) {
    return undefined;
  }

  const referencePart =
    point.rateReferenceValue !== undefined
      ? language === 'pl'
        ? `Baza ${point.rateReferenceValue.toFixed(2)}%`
        : `Base ${point.rateReferenceValue.toFixed(2)}%`
      : undefined;
  const marginPart =
    point.rateMarginApplied !== undefined
      ? language === 'pl'
        ? `Marza ${point.rateMarginApplied.toFixed(2)}%`
        : `Margin ${point.rateMarginApplied.toFixed(2)}%`
      : undefined;

  return [referencePart, marginPart].filter(Boolean).join(' | ');
}

export function buildBondTimelineDisplayRows(
  timeline: YearlyTimelinePoint[],
  language: AppLanguage,
): BondTimelineDisplayRow[] {
  return timeline.map((point) => ({
    key: `${point.cycleIndex}-${point.periodLabel}-${point.cycleEndDate}`,
    periodLabel: point.periodLabel,
    cadenceLabel: getCadenceDisplayLabel(point, language),
    cycleLabel: getCycleDisplayLabel(point, language),
    valueMeaningLabel: getValueMeaningLabel(point, language),
    interestRateLabel: `${point.interestRate.toFixed(2)}%`,
    rateSourceLabel: getRateSourceDisplayLabel(point.rateSource, language),
    referenceLabel: getReferenceDisplayLabel(point, language),
    eventLabels:
      point.events?.map((event) =>
        getSimulationEventDisplayLabel(event.type, language),
      ) ?? [],
    projectionLabel: getProjectionDisplayLabel(point.isProjected, language),
    nominalValue: point.nominalValueAfterInterest,
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
): BondChartDisplayPoint[] {
  return [
    {
      key: 'start',
      xLabel: language === 'pl' ? 'Start' : 'Start',
      nominal: initialInvestment,
      real: initialInvestment,
      inflation: timeline[0]?.inflationReference,
      nbp: timeline[0]?.nbpReference,
      low: comparisonScenarios ? initialInvestment : undefined,
      high: comparisonScenarios ? initialInvestment : undefined,
      isProjected: false,
      isMaturity: false,
      rateLabel:
        language === 'pl' ? 'Kapital poczatkowy' : 'Initial capital',
      eventLabels: [],
    },
    ...timeline.map((point, index) => ({
      key: `${point.cycleIndex}-${point.periodLabel}-${point.cycleEndDate}`,
      xLabel: formatMonthYear(point.cycleEndDate, language),
      nominal: Number(point.nominalValueAfterInterest.toFixed(2)),
      real: Number(point.realValue.toFixed(2)),
      inflation: point.inflationReference,
      nbp: point.nbpReference,
      low: comparisonScenarios?.low[index]?.nominalValueAfterInterest,
      high: comparisonScenarios?.high[index]?.nominalValueAfterInterest,
      isProjected: Boolean(point.isProjected),
      isMaturity: point.isMaturity,
      rateLabel: getRateSourceDisplayLabel(point.rateSource, language),
      eventLabels:
        point.events?.map((event) =>
          getSimulationEventDisplayLabel(event.type, language),
        ) ?? [],
    })),
  ];
}
