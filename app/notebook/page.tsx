import { Metadata } from 'next';
import { NotebookContainer } from '@/features/notebook/components/NotebookContainer';

export const metadata: Metadata = {
  title: 'My Portfolio - Bonds Calculator',
  description: 'Track your real bond investments and project their future value.',
};

export default function NotebookPage() {
  return (
    <div className="container mx-auto">
      <NotebookContainer />
    </div>
  );
}
