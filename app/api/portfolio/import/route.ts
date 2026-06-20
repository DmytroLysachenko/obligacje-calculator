import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/server/http/api-handler';
import { errorJson, okJson } from '@/lib/server/http/responses';
import { importOwnerPortfolio } from '@/lib/server/portfolio/commands';
import { getAuthenticatedPortfolioRouteContext, withPortfolioOwnerResponse } from '@/lib/server/portfolio/http';

const ImportedLotSchema = z.object({
  bondType: z.string().min(1),
  purchaseDate: z.string().min(1),
  amount: z.union([z.string(), z.number()]),
  isRebought: z.boolean().optional(),
  notes: z.string().optional(),
});

const ImportPayloadSchema = z.object({
  portfolio: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    lots: z.array(ImportedLotSchema).min(1),
  }),
});

export const POST = apiHandler(async (req: NextRequest) => {
  const authContext = await getAuthenticatedPortfolioRouteContext();
  if (!authContext.ok) return authContext.response;

  const { owner } = authContext.context;
  const body = await req.json();
  const parsed = ImportPayloadSchema.safeParse(body);

  if (!parsed.success) {
    return errorJson('Invalid import payload', 'IMPORT_VALIDATION_ERROR', parsed.error.issues, { status: 400 });
  }

  const { portfolio } = parsed.data;
  const importedPortfolio = await importOwnerPortfolio(owner.ownerId, portfolio);

  return withPortfolioOwnerResponse(
    okJson({
      portfolio: importedPortfolio.portfolio,
      importedLots: importedPortfolio.importedLots,
    }),
    owner,
  );
});

