import { NextRequest, NextResponse } from 'next/server';
import { InvestmentLotSchema } from '@/features/bond-core/types/portfolio-schemas';
import {
  applyPortfolioOwnerCookie,
  resolvePortfolioOwner,
} from '@/lib/portfolio-access';
import {
  deleteOwnerLot,
  PortfolioServiceError,
  updateOwnerLot,
} from '@/lib/server/portfolio/service';
import { createErrorResponse, createSuccessResponse } from '@/shared/types/api';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await resolvePortfolioOwner();
    const {id} = await params;
    const body = await req.json();
    const validated = InvestmentLotSchema.partial().parse(body);

    const updatedLot = await updateOwnerLot(owner.ownerId, id, validated);
    return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse(updatedLot)), owner);
  } catch (error) {
    if (error instanceof PortfolioServiceError) {
      return NextResponse.json(createErrorResponse(error.message, error.code, error.details), {status: error.status});
    }

    console.error('Failed to update lot:', error);
    return NextResponse.json(createErrorResponse('Database error', 'DATABASE_ERROR'), {status: 500});
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await resolvePortfolioOwner();
    const {id} = await params;

    await deleteOwnerLot(owner.ownerId, id);
    return applyPortfolioOwnerCookie(NextResponse.json(createSuccessResponse({success: true})), owner);
  } catch (error) {
    if (error instanceof PortfolioServiceError) {
      return NextResponse.json(createErrorResponse(error.message, error.code, error.details), {status: error.status});
    }

    console.error('Failed to delete lot:', error);
    return NextResponse.json(createErrorResponse('Database error', 'DATABASE_ERROR'), {status: 500});
  }
}
