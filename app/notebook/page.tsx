import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { NotebookContainer } from '@/features/notebook/components/NotebookContainer';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';
import { PageTransition } from '@/shared/components/page/PageTransition';

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
      <div className="container mx-auto ui-page-flow">
        <NotebookContainer />
      </div>
    </PageTransition>
  );
}
