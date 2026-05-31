import type {Metadata} from 'next';
import {and, eq} from 'drizzle-orm';
import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {PortfolioDetails} from '@/features/notebook/components/PortfolioDetails';
import {db} from '@/db';
import {userPortfolios} from '@/db/schema';
import {ensurePortfolioSchemaCompat} from '@/lib/server/db/portfolio-schema-compat';

interface Props {
  params: Promise<{shareId: string}>;
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  await ensurePortfolioSchemaCompat();
  const page = await getTranslations('metadata.pages.shared_portfolio');
  const common = await getTranslations('common');
  const {shareId} = await params;

  const portfolio = await db.query.userPortfolios.findFirst({
    where: and(eq(userPortfolios.shareId, shareId), eq(userPortfolios.isPublic, true)),
  });

  if (!portfolio) {
    return {
      title: `${page('title')} | ${common('title')}`,
      description: page('description'),
    };
  }

  return {
    title: `${portfolio.name} | ${page('title')}`,
    description: portfolio.description || page('description'),
  };
}

export default async function SharedPortfolioPage({params}: Props) {
  await ensurePortfolioSchemaCompat();
  const page = await getTranslations('shared_portfolio_page');
  const {shareId} = await params;
  const portfolio = await db.query.userPortfolios.findFirst({
    where: and(eq(userPortfolios.shareId, shareId), eq(userPortfolios.isPublic, true)),
  });

  if (!portfolio) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl py-8">
      <div className="mb-8 flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-none">
        <p className="text-sm font-semibold text-muted-foreground">{page('public_notice')}</p>
        <div className="rounded-md border border-border bg-muted px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-foreground">
          {page('read_only')}
        </div>
      </div>
      <PortfolioDetails portfolio={portfolio} onBack={() => {}} />
    </div>
  );
}
