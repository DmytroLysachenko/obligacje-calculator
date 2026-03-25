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
}

export async function resolvePortfolioOwner(): Promise<PortfolioOwnerContext> {
  const session = await auth();
  if (session?.user?.id) {
    return {
      ownerId: session.user.id,
      isGuest: false,
      shouldPersistGuestCookie: false,
    };
  }

  const cookieStore = await cookies();
  let guestOwnerId = cookieStore.get(GUEST_PORTFOLIO_COOKIE)?.value;
  let shouldPersistGuestCookie = false;

  if (!guestOwnerId) {
    guestOwnerId = crypto.randomUUID();
    shouldPersistGuestCookie = true;
  }

  await db
    .insert(users)
    .values({
      id: guestOwnerId,
      name: 'Guest Notebook User',
    })
    .onConflictDoNothing();

  return {
    ownerId: guestOwnerId,
    isGuest: true,
    shouldPersistGuestCookie,
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
