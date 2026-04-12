import { Metadata } from 'next';
import BondOptimizerClient from './BondOptimizerClient';

export const metadata: Metadata = {
  title: 'Smart Bond Finder | Optimal Bond Recommendation',
  description: 'Find the mathematically optimal Polish Treasury Bond for your specific investment duration and amount.',
};

export default function BondOptimizerPage() {
  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Smart Bond Finder</h1>
        <p className="text-muted-foreground max-w-2xl">
          Enter your investment goals and let our engine simulate all available bonds to find the one that will earn you the most.
        </p>
      </div>

      <BondOptimizerClient />
    </div>
  );
}
