import { Suspense } from 'react';

import { BondCalculatorContainer } from '@/features/single-calculator/components/BondCalculatorContainer';
import { parseBondType } from '@/features/single-calculator/lib/single-calculator-state';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';
import { PageSuspenseFallback } from '@/shared/components/page/PageSuspenseFallback';
import { PageTransition } from '@/shared/components/page/PageTransition';
import { BondDefinitionsBoundary } from '@/shared/components/providers/BondDefinitionsBoundary';
import { decodeScenarioFromUrl } from '@/shared/lib/scenario-codec';

export async function generateMetadata() {
  return getLocalizedPageMetadata('single_calculator');
}

export default function SingleCalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ bond?: string | string[]; scenario?: string | string[] }>;
}) {
  return (
    <PageTransition>
      <Suspense fallback={<PageSuspenseFallback />}>
        <SingleCalculatorContent searchParams={searchParams} />
      </Suspense>
    </PageTransition>
  );
}

async function SingleCalculatorContent({
  searchParams,
}: {
  searchParams: Promise<{ bond?: string | string[]; scenario?: string | string[] }>;
}) {
  const params = await searchParams;
  const bond = params.bond;
  const initialBondType = parseBondType(Array.isArray(bond) ? bond[0] : bond);
  const encodedScenario = Array.isArray(params.scenario) ? params.scenario[0] : params.scenario;
  const decodedScenario = decodeScenarioFromUrl(encodedScenario ?? null);
  const initialInputs =
    decodedScenario.ok && decodedScenario.scenario.kind === 'single-bond'
      ? decodedScenario.scenario.intent
      : undefined;

  return (
    <BondDefinitionsBoundary>
      <BondCalculatorContainer initialBondType={initialBondType} initialInputs={initialInputs} />
    </BondDefinitionsBoundary>
  );
}
