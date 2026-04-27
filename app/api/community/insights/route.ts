import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { communityInsights } from '@/db/schema';
import { apiHandler } from '@/lib/api-handler';
import { createSuccessResponse } from '@/shared/types/api';

export const GET = apiHandler(async () => {
  const insights = await db.query.communityInsights.findMany({
    orderBy: (i, { desc }) => [desc(i.popularityScore)],
  });

  return NextResponse.json(createSuccessResponse(insights));
});
