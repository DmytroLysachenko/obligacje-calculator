import { ComparePageClient } from '@/features/comparison-engine/components/ComparePageClient';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';
import { CalculatorRouteBoundary } from '@/shared/components/page/CalculatorRouteBoundary';
import { LocalizedMetadataMarker } from '@/shared/components/page/LocalizedMetadataMarker';

export async function generateMetadata() {
  return getLocalizedPageMetadata('comparison');
}

export default function ComparisonPage() {
  return (
    <>
      <CalculatorRouteBoundary>
        <ComparePageClient />
      </CalculatorRouteBoundary>
      <LocalizedMetadataMarker />
    </>
  );
}
