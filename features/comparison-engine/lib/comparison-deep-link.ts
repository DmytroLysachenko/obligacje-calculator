import { BondType, TaxStrategy } from '@/features/bond-core/types';
import type {
  ScenarioOverride,
  SharedComparisonConfig,
} from '@/features/comparison-engine/lib/comparison-calculator-state';
import { getWithdrawalDateFromMonths } from '@/shared/lib/date-timing';

type SearchParams = Pick<URLSearchParams, 'get'>;

export type ComparisonBondPair = readonly [BondType, BondType];

export interface ComparisonUrlState {
  sharedConfig: SharedComparisonConfig;
  scenarioA: ScenarioOverride;
  scenarioB: ScenarioOverride;
}

const URL_KEYS = [
  'a',
  'b',
  'amount',
  'timing',
  'purchase',
  'withdrawal',
  'horizon',
  'tax',
  'inflation',
  'nbp',
  'taxA',
  'taxB',
  'horizonA',
  'horizonB',
] as const;

export function parseComparisonBondPair(searchParams: SearchParams): ComparisonBondPair | null {
  const a = parseBondType(searchParams.get('a'));
  const b = parseBondType(searchParams.get('b'));

  return a && b && a !== b ? [a, b] : null;
}

export function parseComparisonUrlState(
  searchParams: SearchParams,
  defaults: SharedComparisonConfig,
): ComparisonUrlState | null {
  const pair = parseComparisonBondPair(searchParams);
  if (!pair) return null;

  const purchaseDate = parseDate(searchParams.get('purchase')) ?? defaults.purchaseDate;
  const timingMode = searchParams.get('timing') === 'exact' ? 'exact' : 'general';
  const horizon =
    parseNumber(searchParams.get('horizon'), 1, 600) ?? defaults.investmentHorizonMonths ?? 120;
  const withdrawalDate =
    timingMode === 'exact'
      ? (parseDate(searchParams.get('withdrawal')) ?? defaults.withdrawalDate)
      : getWithdrawalDateFromMonths(purchaseDate, horizon);
  const taxStrategy =
    parseTaxStrategy(searchParams.get('tax')) ?? defaults.taxStrategy ?? TaxStrategy.STANDARD;
  const sharedConfig: SharedComparisonConfig = {
    ...defaults,
    initialInvestment:
      parseNumber(searchParams.get('amount'), 100, 10_000_000) ?? defaults.initialInvestment,
    purchaseDate,
    withdrawalDate,
    investmentHorizonMonths: horizon,
    timingMode,
    taxStrategy,
    expectedInflation:
      parseNumber(searchParams.get('inflation'), -20, 50) ?? defaults.expectedInflation,
    expectedNbpRate: parseNumber(searchParams.get('nbp'), -5, 50) ?? defaults.expectedNbpRate,
  };

  return {
    sharedConfig,
    scenarioA: buildScenario(pair[0], searchParams.get('taxA'), searchParams.get('horizonA')),
    scenarioB: buildScenario(pair[1], searchParams.get('taxB'), searchParams.get('horizonB')),
  };
}

export function withComparisonUrlState(
  pathname: string,
  currentSearchParams: URLSearchParams,
  state: ComparisonUrlState,
) {
  const searchParams = new URLSearchParams(currentSearchParams);
  URL_KEYS.forEach((key) => searchParams.delete(key));

  searchParams.set('a', state.scenarioA.bondType);
  searchParams.set('b', state.scenarioB.bondType);
  searchParams.set('amount', String(state.sharedConfig.initialInvestment));
  searchParams.set('timing', state.sharedConfig.timingMode ?? 'general');
  searchParams.set('purchase', state.sharedConfig.purchaseDate);
  searchParams.set('withdrawal', state.sharedConfig.withdrawalDate);
  searchParams.set('horizon', String(state.sharedConfig.investmentHorizonMonths ?? 120));
  searchParams.set('tax', state.sharedConfig.taxStrategy ?? TaxStrategy.STANDARD);
  searchParams.set('inflation', String(state.sharedConfig.expectedInflation));
  if (state.sharedConfig.expectedNbpRate !== undefined) {
    searchParams.set('nbp', String(state.sharedConfig.expectedNbpRate));
  }
  setScenarioParams(searchParams, 'A', state.scenarioA);
  setScenarioParams(searchParams, 'B', state.scenarioB);
  return `${pathname}?${searchParams.toString()}`;
}

export function withComparisonBondPair(
  pathname: string,
  currentSearchParams: URLSearchParams,
  pair: ComparisonBondPair,
) {
  const searchParams = new URLSearchParams(currentSearchParams);
  searchParams.set('a', pair[0]);
  searchParams.set('b', pair[1]);
  return `${pathname}?${searchParams.toString()}`;
}

function buildScenario(bondType: BondType, taxValue: string | null, horizonValue: string | null) {
  const taxStrategy = parseTaxStrategy(taxValue);
  const investmentHorizonMonths = parseNumber(horizonValue, 1, 600);
  return {
    bondType,
    isRebought: false,
    ...(taxStrategy ? { taxStrategy } : {}),
    ...(investmentHorizonMonths ? { investmentHorizonMonths } : {}),
  } satisfies ScenarioOverride;
}

function setScenarioParams(
  searchParams: URLSearchParams,
  suffix: 'A' | 'B',
  scenario: ScenarioOverride,
) {
  if (scenario.taxStrategy) searchParams.set(`tax${suffix}`, scenario.taxStrategy);
  if (scenario.investmentHorizonMonths !== undefined) {
    searchParams.set(`horizon${suffix}`, String(scenario.investmentHorizonMonths));
  }
}

function parseBondType(value: string | null) {
  return value && Object.values(BondType).includes(value as BondType) ? (value as BondType) : null;
}

function parseTaxStrategy(value: string | null) {
  return value && Object.values(TaxStrategy).includes(value as TaxStrategy)
    ? (value as TaxStrategy)
    : null;
}

function parseNumber(value: string | null, min: number, max: number) {
  if (!value || !/^-?\d+(?:\.\d+)?$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function parseDate(value: string | null) {
  return value &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
    ? value
    : null;
}
