import { RecoveryLabPageClient } from './RecoveryLabPageClient';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';

export async function generateMetadata() {
  return getLocalizedPageMetadata('recovery_lab');
}

export default function RecoveryLabPage() {
  return <RecoveryLabPageClient />;
}
