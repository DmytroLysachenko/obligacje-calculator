import { NextRequest } from 'next/server';
import { z } from 'zod';

import { apiHandler } from '@/lib/server/http/api-handler';
import { readJsonBody } from '@/lib/server/http/read-json-body';
import { okJson } from '@/lib/server/http/responses';
import { importOwnerPortfolio } from '@/lib/server/portfolio/commands';
import { withAuthenticatedPortfolioOwner } from '@/lib/server/portfolio/http';

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
  return withAuthenticatedPortfolioOwner(async (owner) => {
    const { portfolio } = await readJsonBody(req, ImportPayloadSchema);
    const importedPortfolio = await importOwnerPortfolio(owner.ownerId, portfolio);

    return okJson({
      portfolio: importedPortfolio.portfolio,
      importedLots: importedPortfolio.importedLots,
    });
  });
});
