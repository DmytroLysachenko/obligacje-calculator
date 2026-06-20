import { ensurePortfolioSchemaCompat } from '@/lib/server/db/portfolio-schema-compat';
import { findPortfolioByShareId } from '@/lib/server/portfolio/repository';

export async function getPublicSharedPortfolioByShareId(shareId: string) {
  const portfolio = await findPortfolioByShareId(shareId);

  if (!portfolio || !portfolio.isPublic) {
    return null;
  }

  return portfolio;
}

export async function getPublicSharedPortfolioPageData(shareId: string) {
  await ensurePortfolioSchemaCompat();

  return getPublicSharedPortfolioByShareId(shareId);
}

export function buildSharedPortfolioPageMetadata({
  portfolio,
  pageTitle,
  pageDescription,
  appTitle,
}: {
  portfolio: Awaited<ReturnType<typeof getPublicSharedPortfolioByShareId>>;
  pageTitle: string;
  pageDescription: string;
  appTitle: string;
}) {
  if (!portfolio) {
    return {
      title: `${pageTitle} | ${appTitle}`,
      description: pageDescription,
    };
  }

  return {
    title: `${portfolio.name} | ${pageTitle}`,
    description: portfolio.description || pageDescription,
  };
}
