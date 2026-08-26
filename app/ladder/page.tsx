import { LadderPageClient } from '@/features/ladder-strategy/components/LadderPageClient';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';
import { CalculatorRouteBoundary } from '@/shared/components/page/CalculatorRouteBoundary';

export async function generateMetadata() {
  return getLocalizedPageMetadata('ladder');
}

export default function LadderStrategyPage() {
  return (
    <CalculatorRouteBoundary>
      <LadderPageClient />
    </CalculatorRouteBoundary>
  );
}
