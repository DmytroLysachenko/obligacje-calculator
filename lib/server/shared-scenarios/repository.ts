import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { sharedSingleScenarios } from '@/db/schema';

export async function createSharedSingleScenarioRecord(input: {
  title: string;
  description: string;
  payloadJson: string;
}) {
  const [created] = await db
    .insert(sharedSingleScenarios)
    .values({
      title: input.title,
      description: input.description,
      scenarioKind: 'single-bond',
      payloadJson: input.payloadJson,
      calculationVersion: 'single-bond-v2',
    })
    .returning({
      shareId: sharedSingleScenarios.shareId,
    });

  return created;
}

export async function findSharedSingleScenarioRecord(shareId: string) {
  return db.query.sharedSingleScenarios.findFirst({
    where: eq(sharedSingleScenarios.shareId, shareId),
  });
}
