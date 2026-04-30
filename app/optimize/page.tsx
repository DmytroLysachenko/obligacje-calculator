import { Metadata } from 'next';
import BondOptimizerClient from './BondOptimizerClient';

export const metadata: Metadata = {
  title: 'Bond Scenario Ranking | Polish Treasury Bonds',
  description: 'Compare simulated Polish Treasury Bond outcomes for a chosen horizon and assumptions.',
};

export default function BondOptimizerPage() {
  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Bond Scenario Ranking</h1>
        <p className="text-muted-foreground max-w-2xl">
          Enter one scenario, rank simulated outcomes across available bonds, and inspect the tradeoffs. This page is a calculator view, not a personal recommendation engine.
        </p>
      </div>

      <BondOptimizerClient />
    </div>
  );
}
