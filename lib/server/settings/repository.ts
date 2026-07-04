import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { userSettings } from '@/db/schema';

export type UserSettingsRecord = typeof userSettings.$inferSelect;

export async function findUserSettingsByOwner(ownerId: string) {
  return db.query.userSettings.findFirst({
    where: eq(userSettings.userId, ownerId),
  });
}

export async function updateUserSettingsByOwner(
  ownerId: string,
  input: Partial<
    Pick<UserSettingsRecord, 'currency' | 'theme' | 'defaultInflationScenario' | 'chartType'>
  >,
) {
  const [updated] = await db
    .update(userSettings)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(userSettings.userId, ownerId))
    .returning();

  return updated;
}

export async function createUserSettings(
  ownerId: string,
  input: Partial<
    Pick<UserSettingsRecord, 'currency' | 'theme' | 'defaultInflationScenario' | 'chartType'>
  >,
) {
  const [created] = await db
    .insert(userSettings)
    .values({
      userId: ownerId,
      currency: input.currency ?? 'PLN',
      theme: input.theme ?? 'system',
      defaultInflationScenario: input.defaultInflationScenario ?? 'base',
      chartType: input.chartType ?? 'area',
    })
    .returning();

  return created;
}
