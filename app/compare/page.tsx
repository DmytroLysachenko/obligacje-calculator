import { getLocalizedPageMetadata } from '@/lib/page-metadata';

import { ComparePageClient } from './ComparePageClient';

export async function generateMetadata() {
  return getLocalizedPageMetadata('comparison');
}

export default function ComparisonPage() {
  return <ComparePageClient />;
}
