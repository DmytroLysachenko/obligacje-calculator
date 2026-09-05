import EducationClient from '@/features/education/components/EducationClient';
import { getGlobalDataFreshness } from '@/lib/data/market-data';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';
import { LocalizedMetadataMarker } from '@/shared/components/page/LocalizedMetadataMarker';
import { BondDefinitionsBoundary } from '@/shared/components/providers/BondDefinitionsBoundary';

export async function generateMetadata() {
  return getLocalizedPageMetadata('education');
}

export default async function EducationPage() {
  const dataFreshness = await getGlobalDataFreshness();

  return (
    <>
      <BondDefinitionsBoundary>
        <EducationClient dataFreshness={dataFreshness} />
      </BondDefinitionsBoundary>
      <LocalizedMetadataMarker />
    </>
  );
}
