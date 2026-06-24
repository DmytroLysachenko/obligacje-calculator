import { getLocalizedPageMetadata } from '@/lib/page-metadata';
import { BondDefinitionsProvider } from '@/shared/context/BondDefinitionsContext';

import EducationClient from './EducationClient';

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
