import { Metadata } from 'next';
import { NotebookContainer } from '@/features/notebook/components/NotebookContainer';
import { PageTransition } from '@/shared/components/PageTransition';

export const metadata: Metadata = {
  title: 'Notebook - Bonds Calculator',
  description: 'Notebook for stored bond lots, maturities, and exports.',
};

export default function NotebookPage() {
  return (
    <PageTransition>
      <div className="container mx-auto">
        <NotebookContainer />
      </div>
    </PageTransition>
  );
}

