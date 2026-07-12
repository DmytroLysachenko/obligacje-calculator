import { describe, it } from 'vitest';

import { expectContains, expectNotContains, readSource } from '@/docs/test-utils/source-contract';

const routeFiles = [
  'app/single-calculator/page.tsx',
  'app/education/page.tsx',
  'app/shared-scenarios/[shareId]/page.tsx',
] as const;

describe('provider boundary contract', () => {
  it('keeps bond definitions provider at the app layout boundary only', () => {
    const layout = readSource('app/layout.tsx');

    expectContains(layout, '<BondDefinitionsProvider>');
    for (const routeFile of routeFiles) {
      expectNotContains(readSource(routeFile), 'BondDefinitionsProvider');
    }
  });
});
