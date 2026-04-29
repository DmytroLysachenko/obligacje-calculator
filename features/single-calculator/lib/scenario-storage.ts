import { BondInputs, BondType, InterestPayout, TaxStrategy } from '@/features/bond-core/types';
import { getWithdrawalDateFromMonths } from '@/shared/lib/date-timing';

const STORAGE_KEY = 'obligacje.saved-single-scenarios.v1';
const MAX_SCENARIOS = 12;

export type StarterScenarioId =
  | 'inflation-protection'
  | 'child-fund'
  | 'cash-parking'
  | 'ike-ikze';

export interface SavedScenarioRecord {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  inputs: BondInputs;
}

export interface StarterScenarioDefinition {
  id: StarterScenarioId;
  title: string;
  description: string;
  apply: (base: BondInputs) => BondInputs;
}

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `scenario-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const sortScenarios = (scenarios: SavedScenarioRecord[]) =>
  [...scenarios].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

export function getStarterScenarios(): StarterScenarioDefinition[] {
  return [
    {
      id: 'inflation-protection',
      title: 'Protect savings from inflation',
      description: '4-year indexed bond with medium horizon and reinvestment disabled.',
      apply: (base) => {
        const purchaseDate = base.purchaseDate;
        return {
          ...base,
          bondType: BondType.COI,
          initialInvestment: 10000,
          expectedInflation: 4.5,
          duration: 4,
          investmentHorizonMonths: 48,
          purchaseDate,
          withdrawalDate: getWithdrawalDateFromMonths(purchaseDate, 48),
          isRebought: false,
          taxStrategy: TaxStrategy.STANDARD,
          savingsGoal: undefined,
          calculatorMode: 'standard',
        };
      },
    },
    {
      id: 'child-fund',
      title: 'Save for child in 12 years',
      description: 'Long-horizon indexed bond setup focused on purchasing power.',
      apply: (base) => {
        const purchaseDate = base.purchaseDate;
        return {
          ...base,
          bondType: BondType.ROD,
          initialInvestment: 25000,
          expectedInflation: 4,
          duration: 12,
          investmentHorizonMonths: 144,
          purchaseDate,
          withdrawalDate: getWithdrawalDateFromMonths(purchaseDate, 144),
          isRebought: false,
          taxStrategy: TaxStrategy.STANDARD,
          calculatorMode: 'standard',
        };
      },
    },
    {
      id: 'cash-parking',
      title: 'Park cash for 1 year',
      description: 'Short-term low-friction setup to compare temporary savings parking.',
      apply: (base) => {
        const purchaseDate = base.purchaseDate;
        return {
          ...base,
          bondType: BondType.ROR,
          initialInvestment: 15000,
          expectedInflation: 3,
          expectedNbpRate: 5,
          duration: 1,
          investmentHorizonMonths: 12,
          purchaseDate,
          withdrawalDate: getWithdrawalDateFromMonths(purchaseDate, 12),
          isRebought: false,
          taxStrategy: TaxStrategy.STANDARD,
          savingsGoal: undefined,
          calculatorMode: 'standard',
        };
      },
    },
    {
      id: 'ike-ikze',
      title: 'Use IKE/IKZE efficiently',
      description: 'Wrapper-aware scenario to inspect tax drag versus tax-free growth.',
      apply: (base) => {
        const purchaseDate = base.purchaseDate;
        return {
          ...base,
          bondType: BondType.EDO,
          initialInvestment: 20000,
          expectedInflation: 3.5,
          duration: 10,
          investmentHorizonMonths: 120,
          purchaseDate,
          withdrawalDate: getWithdrawalDateFromMonths(purchaseDate, 120),
          useTaxWrapperLimit: true,
          taxStrategy: TaxStrategy.IKE,
          savingsGoal: undefined,
          calculatorMode: 'standard',
        };
      },
    },
  ];
}

export function createSavedScenario(
  inputs: BondInputs,
  overrides?: Partial<Pick<SavedScenarioRecord, 'name' | 'description' | 'tags'>>,
): SavedScenarioRecord {
  const now = new Date().toISOString();
  return {
    id: createId(),
    name: overrides?.name ?? `${inputs.bondType} ${inputs.investmentHorizonMonths ?? Math.round(inputs.duration * 12)}M`,
    description:
      overrides?.description ??
      `Saved ${inputs.bondType} scenario for ${inputs.initialInvestment.toLocaleString('en-US')} PLN.`,
    tags: overrides?.tags ?? [inputs.bondType, inputs.taxStrategy],
    createdAt: now,
    updatedAt: now,
    inputs,
  };
}

export function loadSavedScenarios(): SavedScenarioRecord[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as SavedScenarioRecord[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortScenarios(parsed);
  } catch {
    return [];
  }
}

function persistSavedScenarios(scenarios: SavedScenarioRecord[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortScenarios(scenarios).slice(0, MAX_SCENARIOS)));
}

export function saveScenarioRecord(record: SavedScenarioRecord): SavedScenarioRecord[] {
  const current = loadSavedScenarios();
  const next = [record, ...current.filter((item) => item.id !== record.id)];
  persistSavedScenarios(next);
  return sortScenarios(next).slice(0, MAX_SCENARIOS);
}

export function deleteScenarioRecord(id: string): SavedScenarioRecord[] {
  const current = loadSavedScenarios().filter((item) => item.id !== id);
  persistSavedScenarios(current);
  return current;
}

export function duplicateScenarioRecord(id: string): SavedScenarioRecord[] {
  const current = loadSavedScenarios();
  const match = current.find((item) => item.id === id);
  if (!match) {
    return current;
  }

  const now = new Date().toISOString();
  const duplicate: SavedScenarioRecord = {
    ...match,
    id: createId(),
    name: `${match.name} Copy`,
    createdAt: now,
    updatedAt: now,
  };

  const next = [duplicate, ...current];
  persistSavedScenarios(next);
  return sortScenarios(next).slice(0, MAX_SCENARIOS);
}

export function touchScenarioRecord(id: string, inputs: BondInputs): SavedScenarioRecord[] {
  const current = loadSavedScenarios();
  const next = current.map((item) =>
    item.id === id
      ? {
          ...item,
          inputs,
          updatedAt: new Date().toISOString(),
        }
      : item,
  );
  persistSavedScenarios(next);
  return sortScenarios(next).slice(0, MAX_SCENARIOS);
}

export function getScenarioStorageKey() {
  return STORAGE_KEY;
}

export const DEFAULT_SCENARIO_INPUTS: Pick<
  BondInputs,
  'taxStrategy' | 'isCapitalized' | 'payoutFrequency'
> = {
  taxStrategy: TaxStrategy.STANDARD,
  isCapitalized: true,
  payoutFrequency: InterestPayout.MATURITY,
};
