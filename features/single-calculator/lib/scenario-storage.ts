import { BondInputs } from '@/features/bond-core/types';

const STORAGE_KEY = 'obligacje.saved-single-scenarios.v1';
const MAX_SCENARIOS = 12;

export interface SavedScenarioRecord {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  inputs: BondInputs;
}

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `scenario-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const sortScenarios = (scenarios: SavedScenarioRecord[]) =>
  [...scenarios].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

export function createSavedScenario(
  inputs: BondInputs,
  overrides?: Partial<Pick<SavedScenarioRecord, 'name' | 'description' | 'tags'>>,
): SavedScenarioRecord {
  const now = new Date().toISOString();
  return {
    id: createId(),
    name:
      overrides?.name ??
      `${inputs.bondType} ${inputs.investmentHorizonMonths ?? Math.round(inputs.duration * 12)}M`,
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

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(sortScenarios(scenarios).slice(0, MAX_SCENARIOS)),
  );
}

export function saveScenarioRecord(record: SavedScenarioRecord): SavedScenarioRecord[] {
  const current = loadSavedScenarios();
  const next = [record, ...current.filter((item) => item.id !== record.id)];
  persistSavedScenarios(next);
  return sortScenarios(next).slice(0, MAX_SCENARIOS);
}

export function getScenarioStorageKey() {
  return STORAGE_KEY;
}
