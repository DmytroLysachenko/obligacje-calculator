import type {Metadata} from 'next';
import {eq} from 'drizzle-orm';
import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {BondCalculatorContainer} from '@/features/single-calculator/components/BondCalculatorContainer';
import {db} from '@/db';
import {sharedSingleScenarios} from '@/db/schema';
import {ensurePortfolioSchemaCompat} from '@/lib/server/db/portfolio-schema-compat';
import {BondDefinitionsProvider} from '@/shared/context/BondDefinitionsContext';
import {PageTransition} from '@/shared/components/PageTransition';
import {PageSuspenseFallback} from '@/shared/components/PageSuspenseFallback';
import {parseSharedSingleScenarioPayload} from '@/shared/lib/single-scenario-share';
import {Suspense} from 'react';

interface Props {
  params: Promise<{shareId: string}>;
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  await ensurePortfolioSchemaCompat();
  const page = await getTranslations('metadata.pages.shared_scenario');
  const common = await getTranslations('common');
  const {shareId} = await params;

  const scenario = await db.query.sharedSingleScenarios.findFirst({
    where: eq(sharedSingleScenarios.shareId, shareId),
  });

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

export default async function SharedScenarioPage({params}: Props) {
  await ensurePortfolioSchemaCompat();
  const {shareId} = await params;

  const scenario = await db.query.sharedSingleScenarios.findFirst({
    where: eq(sharedSingleScenarios.shareId, shareId),
  });

  if (!scenario) {
    notFound();
  }

  const parsed = parseSharedSingleScenarioPayload(scenario.payloadJson);

  return (
    <PageTransition>
      <BondDefinitionsProvider>
        <Suspense fallback={<PageSuspenseFallback />}>
          <BondCalculatorContainer
            initialInputs={parsed.inputs}
            sharedScenarioTitle={scenario.title}
          />
        </Suspense>
      </BondDefinitionsProvider>
    </PageTransition>
  );
}
