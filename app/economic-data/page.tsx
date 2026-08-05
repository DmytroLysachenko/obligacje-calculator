import { EconomicDataPageClient } from '@/features/economic-data/components/EconomicDataPageClient';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';
import { BondDefinitionsBoundary } from '@/shared/components/providers/BondDefinitionsBoundary';

export async function generateMetadata() {
  return getLocalizedPageMetadata('economic_data');
}

export default function EconomicDataPage() {
  return (
    <BondDefinitionsBoundary>
      <EconomicDataPageClient />
    </BondDefinitionsBoundary>
  );
}
