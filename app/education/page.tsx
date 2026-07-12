import EducationClient from '@/features/education/components/EducationClient';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';

export async function generateMetadata() {
  return getLocalizedPageMetadata('education');
}

export default function EducationPage() {
  return <EducationClient />;
}
