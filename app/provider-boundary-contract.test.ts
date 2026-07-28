import { describe, it } from 'vitest';

import { expectContains, expectNotContains, readSource } from '@/docs/test-utils/source-contract';

const routeFiles = [
  'app/single-calculator/page.tsx',
  'app/education/page.tsx',
  'app/shared-scenarios/[shareId]/page.tsx',
] as const;

const providerConsumers = [
  'features/single-calculator/hooks/useBondCalculator.ts',
  'features/regular-investment/hooks/useRegularInvestmentCalculator.ts',
  'features/ladder-strategy/hooks/useLadder.ts',
  'features/comparison-engine/hooks/useComparison.ts',
  'features/economic-data/components/EconomicDataPageClient.tsx',
  'features/single-calculator/components/BondInputsForm.tsx',
  'features/regular-investment/components/RegularInvestmentInputsForm.tsx',
  'features/comparison-engine/components/ScenarioOverrideCard.tsx',
  'features/education/components/EducationClient.tsx',
  'features/notebook/components/PortfolioDetails.tsx',
] as const;

describe('provider boundary contract', () => {
  it('keeps bond definitions provider at the app layout boundary only', () => {
    const layout = readSource('app/layout.tsx');

    expectContains(layout, '<BondDefinitionsProvider>');
    for (const routeFile of routeFiles) {
      expectNotContains(readSource(routeFile), 'BondDefinitionsProvider');
    }
  });

  it('keeps every UI caller behind the root definition provider seam', () => {
    for (const consumer of providerConsumers) {
      const source = readSource(consumer);
      expectContains(source, "from '@/shared/context/BondDefinitionsContext'");
      expectNotContains(source, "from '@/shared/hooks/useBondDefinitions'");
    }
  });

  it('keeps resource loading internal to the provider implementation', () => {
    const provider = readSource('shared/context/BondDefinitionsContext.tsx');
    const resourceHook = readSource('shared/hooks/useBondDefinitions.ts');

    expectContains(provider, "useBondDefinitions as useBondDefinitionsHook");
    expectContains(provider, 'BondDefinitionsProvider');
    expectContains(resourceHook, 'new ClientResource');
    expectContains(resourceHook, "'/api/bond-definitions'");
  });

  it('keeps route files free of definition resource loading details', () => {
    for (const routeFile of routeFiles) {
      const source = readSource(routeFile);
      expectNotContains(source, 'ClientResource');
      expectNotContains(source, '/api/bond-definitions');
      expectNotContains(source, 'useClientResource');
    }
  });
});
