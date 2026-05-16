import { BondInputs } from '@/features/bond-core/types';
import { BondInputsSchema } from '@/features/bond-core/types/schemas';

export interface SharedSingleScenarioPayload {
  title: string;
  description: string;
  inputs: BondInputs;
}

export function normalizeSharedSingleScenarioInputs(inputs: BondInputs): BondInputs {
  const rest = { ...inputs };
  delete rest.historicalData;

  return BondInputsSchema.parse({
    ...rest,
    historicalData: undefined,
  });
}

export function buildSharedSingleScenarioPayload(
  inputs: BondInputs,
  description?: string,
): SharedSingleScenarioPayload {
  const normalizedInputs = normalizeSharedSingleScenarioInputs(inputs);
  const horizonMonths =
    normalizedInputs.investmentHorizonMonths
    ?? Math.round(normalizedInputs.duration * 12);

  return {
    title: `Single ${normalizedInputs.bondType} ${horizonMonths}M`,
    description:
      description
      ?? `Committed single-bond scenario for ${normalizedInputs.bondType} over ${horizonMonths} months.`,
    inputs: normalizedInputs,
  };
}

export function serializeSharedSingleScenario(
  payload: SharedSingleScenarioPayload,
) {
  return JSON.stringify(payload);
}

export function parseSharedSingleScenarioPayload(raw: string): SharedSingleScenarioPayload {
  const parsed = JSON.parse(raw) as SharedSingleScenarioPayload;
  return {
    title: parsed.title,
    description: parsed.description,
    inputs: normalizeSharedSingleScenarioInputs(parsed.inputs),
  };
}
