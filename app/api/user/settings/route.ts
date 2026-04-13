import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { applyPortfolioOwnerCookie, resolvePortfolioOwner } from '@/lib/portfolio-access';
import { createSuccessResponse } from '@/shared/types/api';
import { apiHandler } from '@/lib/api-handler';
import { z } from 'zod';

const UserSettingsUpdateSchema = z.object({
  currency: z.string().optional(),
  theme: z.string().optional(),
  defaultInflationScenario: z.string().optional(),
  chartType: z.string().optional(),
});

export const GET = apiHandler(async () => {
  const owner = await resolvePortfolioOwner();
  let settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, owner.ownerId),
  });

  if (!settings) {
    // Return defaults if no settings exist yet
    settings = {
      id: '',
      userId: owner.ownerId,
      currency: 'PLN',
      theme: 'system',
      defaultInflationScenario: 'base',
      chartType: 'area',
      updatedAt: new Date(),
    } as any;
  }

  return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse(settings)), owner);
});

export const PATCH = apiHandler(async (req: NextRequest) => {
  const owner = await resolvePortfolioOwner();
  const body = await req.json();
  const validated = UserSettingsUpdateSchema.parse(body);

  const existing = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, owner.ownerId),
  });

  let updated;
  if (existing) {
    [updated] = await db
      .update(userSettings)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, owner.ownerId))
      .returning();
  } else {
    [updated] = await db
      .insert(userSettings)
      .values({
        userId: owner.ownerId,
        currency: validated.currency ?? 'PLN',
        theme: validated.theme ?? 'system',
        defaultInflationScenario: validated.defaultInflationScenario ?? 'base',
        chartType: validated.chartType ?? 'area',
      })
      .returning();
  }

  return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse(updated)), owner);
});
