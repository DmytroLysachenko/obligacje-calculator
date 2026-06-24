import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { BondCalculatorContainer } from '@/features/single-calculator/components/BondCalculatorContainer';
import { ensurePortfolioSchemaCompat } from '@/lib/server/db/portfolio-schema-compat';
import {
  getSharedSingleScenarioMetadata,
  getSharedSingleScenarioPageData,
} from '@/lib/server/shared-scenarios/service';
import { BondDefinitionsProvider } from '@/shared/context/BondDefinitionsContext';
import { PageTransition } from '@/shared/components/page/PageTransition';
import { PageSuspenseFallback } from '@/shared/components/page/PageSuspenseFallback';
import { Suspense } from 'react';

interface Props {
  params: Promise<{ shareId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await ensurePortfolioSchemaCompat();
  const page = await getTranslations('metadata.pages.shared_scenario');
  const common = await getTranslations('common');
  const { shareId } = await params;

  const scenario = await getSharedSingleScenarioMetadata(shareId);

  if (!scenario) {
    return {
      title: `${page('title')} | ${common('title')}`,
      description: page('description'),
    };
  }

  return {
    title: `${scenario.title} | ${page('title')}`,
    description: scenario.description || page('description'),
  };
}

export default async function SharedScenarioPage({ params }: Props) {
  await ensurePortfolioSchemaCompat();
  const { shareId } = await params;

  const scenario = await getSharedSingleScenarioPageData(shareId);

  if (!scenario) {
    notFound();
  }

  return (
    <PageTransition>
      <BondDefinitionsProvider>
        <Suspense fallback={<PageSuspenseFallback />}>
          <BondCalculatorContainer
            initialInputs={scenario.inputs}
            sharedScenarioTitle={scenario.title}
          />
        </Suspense>
      </BondDefinitionsProvider>
    </PageTransition>
  );
}
