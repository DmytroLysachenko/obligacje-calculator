import { BondInputsSchema } from '@/features/bond-core/types/schemas';
import { getCanonicalUrl } from '@/lib/site-url';
import {
  buildSharedSingleScenarioPayload,
  parseSharedSingleScenarioPayload,
  serializeSharedSingleScenario,
} from '@/shared/lib/single-scenario-share';

import { createSharedSingleScenarioRecord, findSharedSingleScenarioRecord } from './repository';

export const SHARED_SCENARIO_RETENTION_MS = 30 * 24 * 60 * 60_000;

export async function createSharedSingleScenario(
  body: {
    inputs: unknown;
    description?: unknown;
  },
  now = new Date(),
) {
  const validatedInputs = BondInputsSchema.parse(body.inputs);
  const normalizedPayload = buildSharedSingleScenarioPayload(
    validatedInputs,
    typeof body.description === 'string' ? body.description : undefined,
  );

  const created = await createSharedSingleScenarioRecord({
    title: normalizedPayload.title,
    description: normalizedPayload.description,
    payloadJson: serializeSharedSingleScenario(normalizedPayload),
    expiresAt: new Date(now.getTime() + SHARED_SCENARIO_RETENTION_MS),
  });

  return {
    shareId: created.shareId,
    shareUrl: getCanonicalUrl(`/shared-scenarios/${created.shareId}`),
    expiresAt: new Date(now.getTime() + SHARED_SCENARIO_RETENTION_MS).toISOString(),
  };
}

export async function getSharedSingleScenarioMetadata(shareId: string) {
  const scenario = await findSharedSingleScenarioRecord(shareId);

  if (!scenario) {
    return null;
  }

  return {
    title: scenario.title,
    description: scenario.description,
  };
}

export async function getSharedSingleScenarioPageData(shareId: string) {
  const scenario = await findSharedSingleScenarioRecord(shareId);

  if (!scenario) {
    return null;
  }

  const parsed = parseSharedSingleScenarioPayload(scenario.payloadJson);

  return {
    title: scenario.title,
    inputs: parsed.inputs,
  };
}
