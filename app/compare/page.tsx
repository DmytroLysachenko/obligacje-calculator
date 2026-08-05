import { ComparePageClient } from '@/features/comparison-engine/components/ComparePageClient';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';
import { BondDefinitionsBoundary } from '@/shared/components/providers/BondDefinitionsBoundary';

export async function generateMetadata() {
  return getLocalizedPageMetadata('comparison');
}

export default function ComparisonPage() {
  return (
    <BondDefinitionsBoundary>
      <ComparePageClient />
    </BondDefinitionsBoundary>
  );
}
