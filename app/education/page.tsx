import EducationClient from '@/features/education/components/EducationClient';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';
import { BondDefinitionsProvider } from '@/shared/context/BondDefinitionsContext';

export async function generateMetadata() {
  return getLocalizedPageMetadata('education');
}

export default function EducationPage() {
  return (
    <BondDefinitionsProvider>
      <EducationClient />
    </BondDefinitionsProvider>
  );
}
