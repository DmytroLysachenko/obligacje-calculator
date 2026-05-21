import {db} from '@/db';
import {userSettings} from '@/db/schema';
import {eq} from 'drizzle-orm';

export async function getOwnerSettings(ownerId: string) {
  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, ownerId),
  });

  if (settings) {
    return settings;
  }

  return {
    id: '',
    userId: ownerId,
    currency: 'PLN',
    theme: 'system',
    defaultInflationScenario: 'base',
    chartType: 'area',
    updatedAt: new Date(),
  } as typeof userSettings.$inferSelect;
}

export async function updateOwnerSettings(
  ownerId: string,
  input: {
    currency?: string;
    theme?: string;
    defaultInflationScenario?: string;
    chartType?: string;
  },
) {
  const existing = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, ownerId),
  });

  if (existing) {
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
