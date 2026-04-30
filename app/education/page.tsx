import { Metadata } from 'next';
import EducationClient from './EducationClient';
import { BondDefinitionsProvider } from '@/shared/context/BondDefinitionsContext';

export const metadata: Metadata = {
  title: 'Education - Bonds Calculator',
  description: 'Learn the fundamentals of Polish Treasury Bonds, inflation indexing, and Belka tax.',
};

export default function EducationPage() {
  return (
    <BondDefinitionsProvider>
      <EducationClient />
    </BondDefinitionsProvider>
  );
}
