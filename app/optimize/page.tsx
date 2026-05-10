import { Metadata } from 'next';
import BondOptimizerClient from './BondOptimizerClient';
import { FeatureStatusNotice } from '@/shared/components/FeatureStatusNotice';
import { PageTransition } from '@/shared/components/PageTransition';

export const metadata: Metadata = {
  title: 'Bond Scenario Ranking | Polish Treasury Bonds',
  description: 'Compare simulated Polish Treasury Bond outcomes for a chosen horizon and assumptions.',
};

export default function BondOptimizerPage() {
  return (
    <PageTransition>
      <div className="container space-y-8 py-8">
        <FeatureStatusNotice
          status="experimental"
          eyebrow="Supporting sorter"
          title="Experimental ranking view"
        >
          This page is assumption-sensitive and easy to over-read. Use it as a
          supporting scenario sorter after the core calculators, not as a primary
          decision surface.
        </FeatureStatusNotice>

        <BondOptimizerClient />
      </div>
    </PageTransition>
  );
}
