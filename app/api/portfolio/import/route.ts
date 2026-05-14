import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { userInvestmentLots, userPortfolios } from '@/db/schema';
import { applyPortfolioOwnerCookie, resolvePortfolioOwner } from '@/lib/portfolio-access';
import { ensurePortfolioSchemaCompat } from '@/lib/db-schema-compat';
import { apiHandler } from '@/lib/api-handler';
import { createErrorResponse, createSuccessResponse } from '@/shared/types/api';
import { resolveStoredBondLotContext } from '@/lib/bond-series';

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

  const [createdPortfolio] = await db.insert(userPortfolios).values({
    userId: owner.ownerId,
    name: `${portfolio.name} (Imported)`,
    description: portfolio.description ?? 'Imported portfolio package',
  }).returning();

  const importedLots = await Promise.all(
    portfolio.lots.map(async (lot) => {
      const resolvedLotContext = await resolveStoredBondLotContext(
        lot.bondType as import('@/features/bond-core/types').BondType,
        lot.purchaseDate,
      );

      return {
        portfolioId: createdPortfolio.id,
        bondType: lot.bondType,
        bondTypeId: resolvedLotContext.bondTypeId,
        bondSeriesId: resolvedLotContext.bondSeriesId,
        purchaseDate: lot.purchaseDate,
        amount: String(lot.amount),
        isRebought: lot.isRebought ?? false,
        notes: lot.notes,
      };
    }),
  );

  const createdLots = await db.insert(userInvestmentLots).values(importedLots).returning();

  return applyPortfolioOwnerCookie(
    NextResponse.json(createSuccessResponse({
      portfolio: createdPortfolio,
      importedLots: createdLots.length,
    })),
    owner,
  );
});
