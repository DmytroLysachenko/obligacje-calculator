import { LadderPageClient } from '@/features/ladder-strategy/components/LadderPageClient';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';
import { BondDefinitionsBoundary } from '@/shared/components/providers/BondDefinitionsBoundary';

export async function generateMetadata() {
  return getLocalizedPageMetadata('ladder');
}

export default function LadderStrategyPage() {
  return (
    <BondDefinitionsBoundary>
      <LadderPageClient />
    </BondDefinitionsBoundary>
  );
}
