import { NextRequest } from 'next/server';

import { apiHandler } from '@/lib/server/http/api-handler';
import { readBoundedJsonBody, RequestBodyTooLargeError } from '@/lib/server/http/read-json-body';
import { createValidationErrorResponse, okJson } from '@/lib/server/http/responses';
import { importOwnerPortfolio } from '@/lib/server/portfolio/commands';
import { withAuthenticatedPortfolioOwner } from '@/lib/server/portfolio/http';
import { ImportPayloadSchema } from '@/lib/server/portfolio/import-schema';

const MAX_IMPORT_BYTES = 256 * 1024;

export const POST = apiHandler(async (req: NextRequest) => {
  return withAuthenticatedPortfolioOwner(req, async (owner) => {
    const contentType = req.headers.get('content-type')?.toLowerCase() ?? '';
    if (!contentType.startsWith('application/json')) {
      return createValidationErrorResponse(
        'Import payload must be sent as application/json.',
        'UNSUPPORTED_MEDIA_TYPE',
      );
    }

    let payload;
    try {
      payload = await readBoundedJsonBody(req, ImportPayloadSchema, MAX_IMPORT_BYTES);
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return createValidationErrorResponse('Import payload is too large.', 'PAYLOAD_TOO_LARGE');
      }
      throw error;
    }
    const { portfolio } = payload;
    const importedPortfolio = await importOwnerPortfolio(owner.ownerId, portfolio);

    return okJson({
      portfolio: importedPortfolio.portfolio,
      importedLots: importedPortfolio.importedLots,
    });
  });
});
