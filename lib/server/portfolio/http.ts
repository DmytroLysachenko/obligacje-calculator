import { NextRequest, NextResponse } from 'next/server';

import { isTrustedMutationOrigin, requiresOriginCheck } from '@/lib/server/http/mutation-origin';
import { createDomainErrorResponse, createUnauthorizedResponse } from '@/lib/server/http/responses';

import {
  applyPortfolioOwnerCookie,
  type PortfolioOwnerContext,
  resolvePortfolioOwner,
} from './access';
import { PortfolioServiceError } from './errors';

export interface PortfolioRouteContext {
  owner: PortfolioOwnerContext;
}

export async function getPortfolioRouteContext(): Promise<PortfolioRouteContext> {
  return {
    owner: await resolvePortfolioOwner(),
  };
}

async function getAuthenticatedPortfolioRouteContext(): Promise<
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

/** Resolves an owner once and consistently propagates the guest-owner cookie. */
export async function withPortfolioRead(
  handler: (owner: PortfolioOwnerContext) => Promise<NextResponse> | NextResponse,
) {
  const { owner } = await getPortfolioRouteContext();
  return withPortfolioOwnerResponse(await handler(owner), owner);
}

export async function withAuthenticatedPortfolioOwner(
  request: NextRequest,
  handler: (owner: PortfolioOwnerContext) => Promise<NextResponse> | NextResponse,
) {
  if (requiresOriginCheck(request.method) && !isTrustedMutationOrigin(request)) {
    return createUnauthorizedResponse();
  }
  const authContext = await getAuthenticatedPortfolioRouteContext();
  if (!authContext.ok) return authContext.response;

  const { owner } = authContext.context;
  const response = await handler(owner);

  return withPortfolioOwnerResponse(response, owner);
}

/**
 * Command routes share mutation-origin enforcement, authenticated ownership,
 * and owner-cookie propagation. Keep schemas and domain errors in each route.
 */
export const withPortfolioCommand = withAuthenticatedPortfolioOwner;

export function portfolioDomainErrorResponse(error: unknown, owner?: PortfolioOwnerContext) {
  if (!(error instanceof PortfolioServiceError)) {
    return null;
  }

  const response = createDomainErrorResponse(error);
  return owner ? withPortfolioOwnerResponse(response, owner) : response;
}
