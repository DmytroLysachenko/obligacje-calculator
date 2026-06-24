import { getLocalizedPageMetadata } from '@/lib/page-metadata';

import { LadderPageClient } from './LadderPageClient';

export async function generateMetadata() {
  return getLocalizedPageMetadata('ladder');
}

export default function LadderStrategyPage() {
  return <LadderPageClient />;
}
