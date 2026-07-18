import { LandingDashboardClient } from '@/features/home/components/LandingDashboardClient';
import { getGlobalDataFreshness } from '@/lib/data/market-data';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';

export async function generateMetadata() {
  return getLocalizedPageMetadata('home');
}

export default async function LandingDashboardPage() {
  const dataFreshness = await getGlobalDataFreshness();

  return <LandingDashboardClient dataFreshness={dataFreshness} />;
}
