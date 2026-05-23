import { apiHandler } from '@/lib/server/http/api-handler';
import { NextResponse } from 'next/server';
import { getPortfolioRouteContext } from '@/lib/server/portfolio/http';

export const GET = apiHandler(async () => {
  const { owner } = await getPortfolioRouteContext();

  return NextResponse.json({
    data: {
      ownerId: owner.ownerId,
      isGuest: owner.isGuest,
      authMode: owner.authMode,
      canManageWorkspace: !owner.isGuest && owner.authMode === 'authenticated',
    },
  });
});
