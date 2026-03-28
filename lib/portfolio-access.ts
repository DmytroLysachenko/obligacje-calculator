import { auth } from '@/auth';
import { db } from '@/db';
import { userInvestmentLots, userPortfolios, users } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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
    error.message.includes('relation "user" does not exist')
    || error.message.includes('relation "session" does not exist')
    || error.message.includes('relation "account" does not exist')
    || error.message.includes('relation "verificationToken" does not exist')
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
    await db
      .insert(users)
      .values({
        id: ownerId,
        name: 'Guest Notebook User',
      })
      .onConflictDoNothing();
  } catch (error) {
    if (isMissingAuthTableError(error)) {
      // Some deployed/dev databases were created before Auth.js tables were added.
      // Guest notebook mode can still work because portfolio ownership uses a text owner id.
      console.warn('[PortfolioAccess] Auth user table missing, using detached guest notebook owner.');
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
  return db.query.userPortfolios.findFirst({
    where: and(eq(userPortfolios.id, portfolioId), eq(userPortfolios.userId, ownerId)),
  });
}

export async function getOwnedLot(ownerId: string, lotId: string) {
  const [lot] = await db
    .select({
      id: userInvestmentLots.id,
      portfolioId: userInvestmentLots.portfolioId,
    })
    .from(userInvestmentLots)
    .innerJoin(userPortfolios, eq(userInvestmentLots.portfolioId, userPortfolios.id))
    .where(and(eq(userInvestmentLots.id, lotId), eq(userPortfolios.userId, ownerId)))
    .limit(1);

  return lot;
}
