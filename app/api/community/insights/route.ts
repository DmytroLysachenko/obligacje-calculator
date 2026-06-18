import { db } from '@/db';
import { apiHandler } from '@/lib/server/http/api-handler';
import { okJson } from '@/lib/server/http/responses';

export const GET = apiHandler(async () => {
  const insights = await db.query.communityInsights.findMany({
    orderBy: (i, { desc }) => [desc(i.popularityScore)],
  });

  return okJson(insights);
});

