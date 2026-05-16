import { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { BondCalculatorContainer } from '@/features/single-calculator/components/BondCalculatorContainer';
import { BondDefinitionsProvider } from '@/shared/context/BondDefinitionsContext';
import { PageTransition } from '@/shared/components/PageTransition';
import { PageSuspenseFallback } from '@/shared/components/PageSuspenseFallback';
import { Suspense } from 'react';
import { db } from '@/db';
import { sharedSingleScenarios } from '@/db/schema';
import { ensurePortfolioSchemaCompat } from '@/lib/db-schema-compat';
import { parseSharedSingleScenarioPayload } from '@/shared/lib/single-scenario-share';

interface Props {
  params: Promise<{ shareId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await ensurePortfolioSchemaCompat();
  const { shareId } = await params;

  const scenario = await db.query.sharedSingleScenarios.findFirst({
    where: eq(sharedSingleScenarios.shareId, shareId),
  });

  if (!scenario) {
    return {
      title: 'Scenario Not Found',
    };
  }

  return {
    title: `${scenario.title} | Shared Scenario`,
    description: scenario.description || 'Replay this shared single-bond scenario.',
  };
}

export default async function SharedSingleScenarioPage({ params }: Props) {
  await ensurePortfolioSchemaCompat();
  const { shareId } = await params;

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
