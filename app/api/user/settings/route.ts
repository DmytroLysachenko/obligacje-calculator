import { NextRequest, NextResponse } from 'next/server';
import { applyPortfolioOwnerCookie, resolvePortfolioOwner } from '@/lib/server/portfolio/access';
import { createSuccessResponse } from '@/shared/types/api';
import { apiHandler } from '@/lib/server/http/api-handler';
import { z } from 'zod';
import { getOwnerSettings, updateOwnerSettings } from '@/lib/server/settings/service';

const UserSettingsUpdateSchema = z.object({
  currency: z.string().optional(),
  theme: z.string().optional(),
  defaultInflationScenario: z.string().optional(),
  chartType: z.string().optional(),
});

export const GET = apiHandler(async () => {
  const owner = await resolvePortfolioOwner();
  const settings = await getOwnerSettings(owner.ownerId);

  return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse(settings)), owner);
});

export const PATCH = apiHandler(async (req: NextRequest) => {
  const owner = await resolvePortfolioOwner();
  const body = await req.json();
  const validated = UserSettingsUpdateSchema.parse(body);
  const updated = await updateOwnerSettings(owner.ownerId, validated);

  return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse(updated)), owner);
});

