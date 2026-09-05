import { RegularInvestmentCalculatorContainer } from '@/features/regular-investment/components/RegularInvestmentCalculatorContainer';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';
import { CalculatorRouteBoundary } from '@/shared/components/page/CalculatorRouteBoundary';
import { LocalizedMetadataMarker } from '@/shared/components/page/LocalizedMetadataMarker';

export async function generateMetadata() {
  return getLocalizedPageMetadata('regular_investment');
}

export default function RegularInvestmentPage() {
  return (
    <>
      <CalculatorRouteBoundary suspense transition>
        <RegularInvestmentCalculatorContainer />
      </CalculatorRouteBoundary>
      <LocalizedMetadataMarker />
    </>
  );
}
