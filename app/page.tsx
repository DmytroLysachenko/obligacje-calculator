import { Metadata } from 'next';
import { LandingDashboardClient } from './LandingDashboardClient';

export const metadata: Metadata = {
  title: 'Dashboard - Polish Bonds Calculator',
  description: 'Your central hub for Polish treasury bond analysis and simulation.',
};

export default function Home() {
  return <LandingDashboardClient />;
}
