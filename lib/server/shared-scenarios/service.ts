import {db} from '@/db';
import {sharedSingleScenarios} from '@/db/schema';
import {BondInputsSchema} from '@/features/bond-core/types/schemas';
import {
  buildSharedSingleScenarioPayload,
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
