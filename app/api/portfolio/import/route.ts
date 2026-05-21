import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { applyPortfolioOwnerCookie, resolvePortfolioOwner } from '@/lib/server/portfolio/access';
import { ensurePortfolioSchemaCompat } from '@/lib/server/db/portfolio-schema-compat';
import { apiHandler } from '@/lib/server/http/api-handler';
import { createErrorResponse, createSuccessResponse } from '@/shared/types/api';
import { importOwnerPortfolio } from '@/lib/server/portfolio/service';

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
  await ensurePortfolioSchemaCompat();
  const owner = await resolvePortfolioOwner();
  const body = await req.json();
  const parsed = ImportPayloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      createErrorResponse('Invalid import payload', 'IMPORT_VALIDATION_ERROR', parsed.error.issues),
      { status: 400 },
    );
  }

  const { portfolio } = parsed.data;
  const importedPortfolio = await importOwnerPortfolio(owner.ownerId, portfolio);

  return applyPortfolioOwnerCookie(
    NextResponse.json(createSuccessResponse({
      portfolio: importedPortfolio.portfolio,
      importedLots: importedPortfolio.importedLots,
    })),
    owner,
  );
});

