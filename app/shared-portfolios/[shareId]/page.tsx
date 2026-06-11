import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {PortfolioDetails} from '@/features/notebook/components/PortfolioDetails';
import {ensurePortfolioSchemaCompat} from '@/lib/server/db/portfolio-schema-compat';
import {getPublicSharedPortfolioByShareId} from '@/lib/server/portfolio/service';

interface Props {
  params: Promise<{shareId: string}>;
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  await ensurePortfolioSchemaCompat();
  const page = await getTranslations('metadata.pages.shared_portfolio');
  const common = await getTranslations('common');
  const {shareId} = await params;

  const portfolio = await getPublicSharedPortfolioByShareId(shareId);

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
  const portfolio = await getPublicSharedPortfolioByShareId(shareId);

  if (!portfolio) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl py-8">
      <div className="mb-8 flex items-center justify-between gap-4 border-y border-border py-4">
        <p className="text-sm font-semibold text-muted-foreground">{page('public_notice')}</p>
        <div className="border-l-2 border-border pl-3 text-[10px] font-semibold uppercase tracking-widest text-foreground">
          {page('read_only')}
        </div>
      </div>
      <PortfolioDetails portfolio={portfolio} onBack={() => {}} />
    </div>
  );
}
