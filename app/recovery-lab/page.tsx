import { getLocalizedPageMetadata } from '@/lib/page-metadata';

import { RecoveryLabPageClient } from './RecoveryLabPageClient';

export async function generateMetadata() {
  return getLocalizedPageMetadata('recovery_lab');
}

export default function RecoveryLabPage() {
  return <RecoveryLabPageClient />;
}
