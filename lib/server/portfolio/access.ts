import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ensurePortfolioSchemaCompat } from '@/lib/server/db/portfolio-schema-compat';
import {
  ensureGuestPortfolioOwner,
  findOwnedLotByOwner,
  findPortfolioByOwner,
  findPortfolioSummaryByOwner,
} from '@/lib/server/portfolio/repository';

const GUEST_PORTFOLIO_COOKIE = 'guest_portfolio_owner_id';
const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export interface PortfolioOwnerContext {
  ownerId: string;
  isGuest: boolean;
  shouldPersistGuestCookie: boolean;
  authMode: 'authenticated' | 'guest' | 'auth_unavailable_guest_fallback';
}

function isAuthConfigured() {
  return Boolean(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET);
}

function isMissingSecretError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes('MissingSecret');
}

function isMissingAuthTableError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes('relation "user" does not exist') ||
    error.message.includes('relation "session" does not exist') ||
    error.message.includes('relation "account" does not exist') ||
    error.message.includes('relation "verificationToken" does not exist')
  );
}

async function resolveAuthenticatedOwner() {
  if (!isAuthConfigured()) {
    return null;
  }

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return null;
    }

    return {
      ownerId: session.user.id,
      isGuest: false,
      shouldPersistGuestCookie: false,
      authMode: 'authenticated' as const,
    };
  } catch (error) {
    if (isMissingSecretError(error) || isMissingAuthTableError(error)) {
      console.warn('[PortfolioAccess] Auth unavailable, falling back to guest notebook mode.');
      return null;
    }

    throw error;
  }
}

async function ensureGuestOwner(ownerId: string) {
  try {
    await ensureGuestPortfolioOwner(ownerId);
  } catch (error) {
    if (isMissingAuthTableError(error)) {
      console.warn(
        '[PortfolioAccess] Auth user table missing, using detached guest notebook owner.',
      );
      return;
    }

    throw error;
  }
}

export async function resolvePortfolioOwner(): Promise<PortfolioOwnerContext> {
  const authenticatedOwner = await resolveAuthenticatedOwner();
  if (authenticatedOwner) {
    return authenticatedOwner;
  }

  const cookieStore = await cookies();
  let guestOwnerId = cookieStore.get(GUEST_PORTFOLIO_COOKIE)?.value;
  let shouldPersistGuestCookie = false;

  if (!guestOwnerId) {
    guestOwnerId = crypto.randomUUID();
    shouldPersistGuestCookie = true;
  }

  await ensureGuestOwner(guestOwnerId);

  return {
    ownerId: guestOwnerId,
    isGuest: true,
    shouldPersistGuestCookie,
    authMode: isAuthConfigured() ? 'guest' : 'auth_unavailable_guest_fallback',
  };
}

export function applyPortfolioOwnerCookie(response: NextResponse, owner: PortfolioOwnerContext) {
  if (!owner.isGuest || !owner.shouldPersistGuestCookie) {
    return response;
  }

  response.cookies.set(GUEST_PORTFOLIO_COOKIE, owner.ownerId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: GUEST_COOKIE_MAX_AGE,
  });

  return response;
}

export async function getOwnedPortfolio(ownerId: string, portfolioId: string) {
  await ensurePortfolioSchemaCompat();
  return findPortfolioByOwner(ownerId, portfolioId);
}

export async function getOwnedLot(ownerId: string, lotId: string) {
  await ensurePortfolioSchemaCompat();
  return findOwnedLotByOwner(ownerId, lotId);
}

export async function getPortfolioSummary(ownerId: string, portfolioId: string) {
  await ensurePortfolioSchemaCompat();
  return findPortfolioSummaryByOwner(ownerId, portfolioId);
}
