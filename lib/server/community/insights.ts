import {db} from '@/db';

export async function listCommunityInsights() {
  return db.query.communityInsights.findMany({
    orderBy: (insight, {desc}) => [desc(insight.popularityScore)],
  });
}
