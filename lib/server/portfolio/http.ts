import { NextResponse } from 'next/server';
import { ensurePortfolioSchemaCompat } from '@/lib/server/db/portfolio-schema-compat';
import { applyPortfolioOwnerCookie, resolvePortfolioOwner, type PortfolioOwnerContext } from './access';

export interface PortfolioRouteContext {
  owner: PortfolioOwnerContext;
}

export async function getPortfolioRouteContext(): Promise<PortfolioRouteContext> {
  await ensurePortfolioSchemaCompat();

  return {
    owner: await resolvePortfolioOwner(),
  };
}

export function withPortfolioOwnerResponse(response: NextResponse, owner: PortfolioOwnerContext) {
  return applyPortfolioOwnerCookie(response, owner);
}
