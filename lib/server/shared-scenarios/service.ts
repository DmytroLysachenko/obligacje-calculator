import {db} from '@/db';
import {sharedSingleScenarios} from '@/db/schema';
import {eq} from 'drizzle-orm';
import {BondInputsSchema} from '@/features/bond-core/types/schemas';
import {
  buildSharedSingleScenarioPayload,
  parseSharedSingleScenarioPayload,
  serializeSharedSingleScenario,
} from '@/shared/lib/single-scenario-share';

export async function createSharedSingleScenario(
  body: {
    inputs: unknown;
    description?: unknown;
    origin: string;
  },
) {
  const validatedInputs = BondInputsSchema.parse(body.inputs);
  const normalizedPayload = buildSharedSingleScenarioPayload(
    validatedInputs,
    typeof body.description === 'string' ? body.description : undefined,
  );

  const [created] = await db
    .insert(sharedSingleScenarios)
    .values({
      title: normalizedPayload.title,
      description: normalizedPayload.description,
      scenarioKind: 'single-bond',
      payloadJson: serializeSharedSingleScenario(normalizedPayload),
      calculationVersion: 'single-bond-v2',
    })
    .returning({
      shareId: sharedSingleScenarios.shareId,
    });

  return {
    shareId: created.shareId,
    shareUrl: `${body.origin}/shared-scenarios/${created.shareId}`,
  };
}

async function findSharedSingleScenario(shareId: string) {
  return db.query.sharedSingleScenarios.findFirst({
    where: eq(sharedSingleScenarios.shareId, shareId),
  });
}

export async function getSharedSingleScenarioMetadata(shareId: string) {
  const scenario = await findSharedSingleScenario(shareId);

  if (!scenario) {
    return null;
  }

  return {
    title: scenario.title,
    description: scenario.description,
  };
}

export async function getSharedSingleScenarioPageData(shareId: string) {
  const scenario = await findSharedSingleScenario(shareId);

  if (!scenario) {
    return null;
  }

  const parsed = parseSharedSingleScenarioPayload(scenario.payloadJson);

  return {
    title: scenario.title,
    inputs: parsed.inputs,
  };
}
