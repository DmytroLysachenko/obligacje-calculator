import { getLocalizedPageMetadata } from '@/lib/page-metadata';

import { LandingDashboardClient } from './LandingDashboardClient';

export async function generateMetadata() {
  return getLocalizedPageMetadata('home');
}

export default function LandingDashboardPage() {
  return <LandingDashboardClient />;
}
