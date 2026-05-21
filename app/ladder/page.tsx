import {LadderPageClient} from './LadderPageClient';
import {getLocalizedPageMetadata} from '@/lib/page-metadata';

export async function generateMetadata() {
  return getLocalizedPageMetadata('ladder');
}

export default function LadderStrategyPage() {
  return <LadderPageClient />;
}
