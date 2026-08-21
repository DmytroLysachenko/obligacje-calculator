import { BondInputs } from '@/features/bond-core/types';

export interface SharedSingleScenarioPayload {
  title: string;
  description: string;
  inputs: BondInputs;
}

function normalizeSharedSingleScenarioInputs(inputs: BondInputs): BondInputs {
  const rest = { ...inputs };
  delete rest.historicalData;

  // Client-side share construction only removes private historical context.
  // The API validates this untrusted payload before storage.
  return {
    ...rest,
    historicalData: undefined,
  };
}

export function buildSharedSingleScenarioPayload(
  inputs: BondInputs,
  description?: string,
): SharedSingleScenarioPayload {
  const normalizedInputs = normalizeSharedSingleScenarioInputs(inputs);
  const horizonMonths =
    normalizedInputs.investmentHorizonMonths ?? Math.round(normalizedInputs.duration * 12);

  return {
    title: `Single ${normalizedInputs.bondType} ${horizonMonths}M`,
    description:
      description ??
      `Committed single-bond scenario for ${normalizedInputs.bondType} over ${horizonMonths} months.`,
    inputs: normalizedInputs,
  };
}

export function serializeSharedSingleScenario(payload: SharedSingleScenarioPayload) {
  return JSON.stringify(payload);
}
