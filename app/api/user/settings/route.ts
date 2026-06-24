import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/server/http/api-handler';
import { z } from 'zod';
import { getOwnerSettings, updateOwnerSettings } from '@/lib/server/settings/service';
import { readJsonBody } from '@/lib/server/http/read-json-body';
import { getPortfolioRouteContext, withPortfolioOwnerResponse } from '@/lib/server/portfolio/http';
import { okJson } from '@/lib/server/http/responses';

const UserSettingsUpdateSchema = z.object({
  currency: z.string().optional(),
  theme: z.string().optional(),
  defaultInflationScenario: z.string().optional(),
  chartType: z.string().optional(),
});

export const GET = apiHandler(async () => {
  const { owner } = await getPortfolioRouteContext();
  const settings = await getOwnerSettings(owner.ownerId);

  return withPortfolioOwnerResponse(okJson(settings), owner);
});

export const PATCH = apiHandler(async (req: NextRequest) => {
  const { owner } = await getPortfolioRouteContext();
  const validated = await readJsonBody(req, UserSettingsUpdateSchema);
  const updated = await updateOwnerSettings(owner.ownerId, validated);

  return withPortfolioOwnerResponse(okJson(updated), owner);
});
