import { NotebookContainer } from '@/features/notebook/components/NotebookContainer';
import { PageTransition } from '@/shared/components/PageTransition';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';

export async function generateMetadata() {
  return getLocalizedPageMetadata('notebook');
}

export default function PortfolioNotebookPage() {
  return (
    <PageTransition>
      <div className="container mx-auto">
        <NotebookContainer />
      </div>
    </PageTransition>
  );
}
