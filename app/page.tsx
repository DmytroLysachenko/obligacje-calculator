import { Metadata } from 'next';
import { LandingDashboardClient } from './LandingDashboardClient';

export const metadata: Metadata = {
  title: 'Home - Polish Bonds Calculator',
  description: 'Recovery-first home for the Polish treasury bond calculator.',
};

export default function Home() {
  return <LandingDashboardClient />;
}
