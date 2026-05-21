import {MultiAssetPageClient} from './MultiAssetPageClient';
import {getLocalizedPageMetadata} from '@/lib/page-metadata';

export async function generateMetadata() {
  return getLocalizedPageMetadata('multi_asset');
}

export default function MultiAssetComparisonPage() {
  return <MultiAssetPageClient />;
}
