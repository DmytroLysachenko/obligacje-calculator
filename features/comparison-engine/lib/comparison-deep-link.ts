import { BondType, TaxStrategy } from '@/features/bond-core/types';
import { isIsoCalendarDate } from '@/features/bond-core/types/iso-calendar-date';
import type {
  ScenarioOverride,
  SharedComparisonConfig,
} from '@/features/comparison-engine/lib/comparison-calculator-state';
import { getWithdrawalDateFromMonths } from '@/shared/lib/date-timing';
import {
  createComparisonScenarioPackage,
  decodeScenarioFromUrl,
  encodeScenarioForUrl,
} from '@/shared/lib/scenario-codec';

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
  'scenario',
] as const;

export class ComparisonScenarioUrlTooLongError extends Error {}

export function parseComparisonBondPair(searchParams: SearchParams): ComparisonBondPair | null {
  const a = parseBondType(searchParams.get('a'));
  const b = parseBondType(searchParams.get('b'));

  return a && b ? [a, b] : null;
}

export function parseComparisonUrlState(
  searchParams: SearchParams,
  defaults: SharedComparisonConfig,
): ComparisonUrlState | null {
  const portable = decodeScenarioFromUrl(searchParams.get('scenario'));
  if (portable.ok && portable.scenario.kind === 'bond-comparison') {
    const intent = portable.scenario.intent;
    return {
      sharedConfig: intent.sharedConfig,
      scenarioA: intent.scenarioA,
      scenarioB: intent.scenarioB,
    };
  }
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

  const encoded = encodeScenarioForUrl(
    createComparisonScenarioPackage({
      mode: 'independent',
      sharedConfig: state.sharedConfig,
      scenarioA: state.scenarioA,
      scenarioB: state.scenarioB,
    }),
  );
  if (!encoded) throw new ComparisonScenarioUrlTooLongError('Scenario requires a local package.');
  searchParams.set('scenario', encoded);
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
  return value && isIsoCalendarDate(value) ? value : null;
}
