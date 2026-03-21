import { LadderContainer } from '@/features/ladder-strategy/components/LadderContainer';
import { PageTransition } from '@/shared/components/PageTransition';
import { Suspense } from 'react';

export default function LadderPage() {
  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={<div>Loading strategy...</div>}>
          <LadderContainer />
        </Suspense>
      </div>
    </PageTransition>
  );
}
