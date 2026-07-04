import { ComparePageClient } from '@/features/comparison-engine/components/ComparePageClient';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';

export async function generateMetadata() {
  return getLocalizedPageMetadata('comparison');
}

export default function ComparisonPage() {
  return <ComparePageClient />;
}
