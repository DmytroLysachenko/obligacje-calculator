import { LandingDashboardClient } from './LandingDashboardClient';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';

export async function generateMetadata() {
  return getLocalizedPageMetadata('home');
}

export default function LandingDashboardPage() {
  return <LandingDashboardClient />;
}
