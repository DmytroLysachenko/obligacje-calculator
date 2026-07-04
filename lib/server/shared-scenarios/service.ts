import { BondInputsSchema } from '@/features/bond-core/types/schemas';
import {
  buildSharedSingleScenarioPayload,
  parseSharedSingleScenarioPayload,
  serializeSharedSingleScenario,
} from '@/shared/lib/single-scenario-share';

import { createSharedSingleScenarioRecord, findSharedSingleScenarioRecord } from './repository';

export async function createSharedSingleScenario(body: {
  inputs: unknown;
  description?: unknown;
  origin: string;
}) {
  const validatedInputs = BondInputsSchema.parse(body.inputs);
  const normalizedPayload = buildSharedSingleScenarioPayload(
    validatedInputs,
    typeof body.description === 'string' ? body.description : undefined,
  );

  const created = await createSharedSingleScenarioRecord({
    title: normalizedPayload.title,
    description: normalizedPayload.description,
    payloadJson: serializeSharedSingleScenario(normalizedPayload),
  });

  return {
    shareId: created.shareId,
    shareUrl: `${body.origin}/shared-scenarios/${created.shareId}`,
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
