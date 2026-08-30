import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { NotebookContainer } from '@/features/notebook/components/NotebookContainer';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';
import { PageTransition } from '@/shared/components/page/PageTransition';
import { BondDefinitionsBoundary } from '@/shared/components/providers/BondDefinitionsBoundary';

export async function generateMetadata() {
  return getLocalizedPageMetadata('notebook');
}

export default async function PortfolioNotebookPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=%2Fnotebook');
  }

  return (
    <PageTransition>
      <div className="ui-page-flow">
        <BondDefinitionsBoundary>
          <NotebookContainer />
        </BondDefinitionsBoundary>
      </div>
    </PageTransition>
  );
}
