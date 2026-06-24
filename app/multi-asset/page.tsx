import { getLocalizedPageMetadata } from '@/lib/page-metadata';

import { MultiAssetPageClient } from './MultiAssetPageClient';

export async function generateMetadata() {
  return getLocalizedPageMetadata('multi_asset');
}

export default function MultiAssetComparisonPage() {
  return <MultiAssetPageClient />;
}
