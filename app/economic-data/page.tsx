import {EconomicDataPageClient} from './EconomicDataPageClient';
import {getLocalizedPageMetadata} from '@/lib/page-metadata';

export async function generateMetadata() {
  return getLocalizedPageMetadata('economic_data');
}

export default function EconomicDataPage() {
  return <EconomicDataPageClient />;
}



