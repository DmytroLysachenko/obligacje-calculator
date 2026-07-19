import EducationClient from '@/features/education/components/EducationClient';
import { getGlobalDataFreshness } from '@/lib/data/market-data';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';

export async function generateMetadata() {
  return getLocalizedPageMetadata('education');
}

export default async function EducationPage() {
  const dataFreshness = await getGlobalDataFreshness();

  return <EducationClient dataFreshness={dataFreshness} />;
}
