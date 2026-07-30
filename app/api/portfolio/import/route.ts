import { NextRequest } from 'next/server';

import { apiHandler } from '@/lib/server/http/api-handler';
import { readJsonBody } from '@/lib/server/http/read-json-body';
import { okJson } from '@/lib/server/http/responses';
import { importOwnerPortfolio } from '@/lib/server/portfolio/commands';
import { withAuthenticatedPortfolioOwner } from '@/lib/server/portfolio/http';
import { ImportPayloadSchema } from '@/lib/server/portfolio/import-schema';

export const POST = apiHandler(async (req: NextRequest) => {
  return withAuthenticatedPortfolioOwner(req, async (owner) => {
    const { portfolio } = await readJsonBody(req, ImportPayloadSchema);
    const importedPortfolio = await importOwnerPortfolio(owner.ownerId, portfolio);

    return okJson({
      portfolio: importedPortfolio.portfolio,
      importedLots: importedPortfolio.importedLots,
    });
  });
});
