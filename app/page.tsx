import { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'Bonds Calculator - Polish Treasury Bonds Simulator',
  description: 'Professional and educational calculator for Polish retail treasury bonds (EDO, COI, ROR, etc.).',
};

export default function Home() {
  return <HomeClient />;
}
