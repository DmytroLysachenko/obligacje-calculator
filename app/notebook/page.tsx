import { NotebookContainer } from '@/features/notebook/components/NotebookContainer';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';
import { PageTransition } from '@/shared/components/page/PageTransition';

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
