import { NextResponse } from 'next/server';
import { ensurePortfolioSchemaCompat } from '@/lib/server/db/portfolio-schema-compat';
import {
  applyPortfolioOwnerCookie,
  resolvePortfolioOwner,
  type PortfolioOwnerContext,
} from './access';
import { createDomainErrorResponse, createUnauthorizedResponse } from '@/lib/server/http/responses';
import { PortfolioServiceError } from './errors';

export interface PortfolioRouteContext {
  owner: PortfolioOwnerContext;
}

export async function getPortfolioRouteContext(): Promise<PortfolioRouteContext> {
  await ensurePortfolioSchemaCompat();

  return {
    owner: await resolvePortfolioOwner(),
  };
}

export async function getAuthenticatedPortfolioRouteContext(): Promise<
  { ok: true; context: PortfolioRouteContext } | { ok: false; response: NextResponse }
> {
  const context = await getPortfolioRouteContext();

  if (context.owner.authMode !== 'authenticated' || context.owner.isGuest) {
    return {
      ok: false,
      response: createUnauthorizedResponse(),
    };
  }

  return {
    ok: true,
    context,
  };
}

export function withPortfolioOwnerResponse(response: NextResponse, owner: PortfolioOwnerContext) {
  return applyPortfolioOwnerCookie(response, owner);
}

export async function withAuthenticatedPortfolioOwner(
  handler: (owner: PortfolioOwnerContext) => Promise<NextResponse> | NextResponse,
) {
  const authContext = await getAuthenticatedPortfolioRouteContext();
  if (!authContext.ok) return authContext.response;

  const { owner } = authContext.context;
  const response = await handler(owner);

  return withPortfolioOwnerResponse(response, owner);
}

export function portfolioDomainErrorResponse(error: unknown, owner?: PortfolioOwnerContext) {
  if (!(error instanceof PortfolioServiceError)) {
    return null;
  }

  const response = createDomainErrorResponse(error);
  return owner ? withPortfolioOwnerResponse(response, owner) : response;
}
