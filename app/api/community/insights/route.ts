import { apiHandler } from '@/lib/server/http/api-handler';
import { okJson } from '@/lib/server/http/responses';
import { listCommunityInsights } from '@/lib/server/community/insights';

export const GET = apiHandler(async () => {
  const insights = await listCommunityInsights();

  return okJson(insights);
});

