import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {PortfolioDetails} from '@/features/notebook/components/PortfolioDetails';
import {
  buildSharedPortfolioPageMetadata,
  getPublicSharedPortfolioPageData,
} from '@/lib/server/portfolio/queries';

interface Props {
  params: Promise<{shareId: string}>;
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const page = await getTranslations('metadata.pages.shared_portfolio');
  const common = await getTranslations('common');
  const {shareId} = await params;
  const portfolio = await getPublicSharedPortfolioPageData(shareId);

  return buildSharedPortfolioPageMetadata({
    portfolio,
    pageTitle: page('title'),
    pageDescription: page('description'),
    appTitle: common('title'),
  });
}

export default async function SharedPortfolioPage({params}: Props) {
  const page = await getTranslations('shared_portfolio_page');
  const {shareId} = await params;
  const portfolio = await getPublicSharedPortfolioPageData(shareId);

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
