import { and, eq, gt, lte } from 'drizzle-orm';

import { db } from '@/db';
import { sharedSingleScenarios } from '@/db/schema';

export async function createSharedSingleScenarioRecord(input: {
  title: string;
  description: string;
  payloadJson: string;
  expiresAt: Date;
}) {
  const [created] = await db
    .insert(sharedSingleScenarios)
    .values({
      title: input.title,
      description: input.description,
      scenarioKind: 'single-bond',
      payloadJson: input.payloadJson,
      calculationVersion: 'single-bond-v2',
      expiresAt: input.expiresAt,
    })
    .returning({
      shareId: sharedSingleScenarios.shareId,
    });

  return created;
}

export async function findSharedSingleScenarioRecord(shareId: string, now = new Date()) {
  return db.query.sharedSingleScenarios.findFirst({
    where: and(
      eq(sharedSingleScenarios.shareId, shareId),
      gt(sharedSingleScenarios.expiresAt, now),
    ),
  });
}

export async function deleteExpiredSharedSingleScenarios(now = new Date()) {
  return db.delete(sharedSingleScenarios).where(lte(sharedSingleScenarios.expiresAt, now));
}
