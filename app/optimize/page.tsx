import { Metadata } from 'next';
import BondOptimizerClient from './BondOptimizerClient';
import { FeatureStatusNotice } from '@/shared/components/FeatureStatusNotice';

export const metadata: Metadata = {
  title: 'Bond Scenario Ranking | Polish Treasury Bonds',
  description: 'Compare simulated Polish Treasury Bond outcomes for a chosen horizon and assumptions.',
};

export default function BondOptimizerPage() {
  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Bond Scenario Ranking</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Enter one scenario, sort projected payouts across available bonds, and inspect the tradeoffs. This page is a calculator view, not a recommendation engine.
        </p>
      </div>

      <FeatureStatusNotice status="experimental" title="Experimental ranking surface">
        This page is still assumption-sensitive and easy to over-read. Use it as a supporting scenario sorter,
        not as a primary decision surface.
      </FeatureStatusNotice>

      <BondOptimizerClient />
    </div>
  );
}
