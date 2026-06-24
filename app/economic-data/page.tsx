import { getLocalizedPageMetadata } from '@/lib/page-metadata';

import { EconomicDataPageClient } from './EconomicDataPageClient';

export async function generateMetadata() {
  return getLocalizedPageMetadata('economic_data');
}

export default function EconomicDataPage() {
  return <EconomicDataPageClient />;
}
