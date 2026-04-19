import { db } from '@/db';
import { userPortfolios } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { PortfolioDetails } from '@/features/notebook/components/PortfolioDetails';
import { Metadata } from 'next';

interface Props {
  params: Promise<{ shareId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareId } = await params;
  const portfolio = await db.query.userPortfolios.findFirst({
    where: and(
      eq(userPortfolios.shareId, shareId),
      eq(userPortfolios.isPublic, true)
    ),
  });

  if (!portfolio) return { title: 'Portfolio Not Found' };

  return {
    title: `${portfolio.name} | Shared Portfolio`,
    description: portfolio.description || 'View this bond investment portfolio.',
  };
}

export default async function SharedPortfolioPage({ params }: Props) {
  const { shareId } = await params;
  const portfolio = await db.query.userPortfolios.findFirst({
    where: and(
      eq(userPortfolios.shareId, shareId),
      eq(userPortfolios.isPublic, true)
    ),
  });

  if (!portfolio) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="mb-8 p-4 bg-primary/5 rounded-2xl border-2 border-primary/10 flex items-center justify-between">
        <p className="text-sm font-bold text-primary italic">You are viewing a shared public portfolio.</p>
        <div className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase rounded-lg tracking-widest">Read Only</div>
      </div>
      {/* 
        Note: PortfolioDetails is designed for the dashboard but we reuse it here.
        In a real app, we'd wrap it in a ReadOnly provider or pass a flag.
      */}
      <PortfolioDetails 
        portfolio={portfolio} 
        onBack={() => {}} 
      />
    </div>
  );
}
