import EducationClient from './EducationClient';
import { BondDefinitionsProvider } from '@/shared/context/BondDefinitionsContext';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';

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
