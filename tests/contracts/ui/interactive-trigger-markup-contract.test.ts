import { describe, it } from 'vitest';

import { expectContains, expectNoFragments, readSource } from '../test-utils/source-contract';

const accordionTriggerFiles = [
  'shared/components/forms/AdvancedAssumptionsDisclosure.tsx',
  'shared/components/results/SecondaryInsightAccordion.tsx',
  'shared/components/reference/ReferenceGuideRail.tsx',
  'features/comparison-engine/components/ComparisonControls.tsx',
] as const;

function getAccordionTriggerBlocks(source: string) {
  return source.match(/<AccordionTrigger[\s\S]*?<\/AccordionTrigger>/g) ?? [];
}

describe('interactive trigger markup contract', () => {
  it('keeps Radix accordion trigger bodies phrasing-safe for React hydration', () => {
    for (const file of accordionTriggerFiles) {
      const source = readSource(file);
      const triggerBlocks = getAccordionTriggerBlocks(source);

      expectContains(source, '<AccordionTrigger');
      for (const triggerBlock of triggerBlocks) {
        expectNoFragments(triggerBlock, [
          '<div className="flex items-start gap-3 text-left">',
          '<div className="flex min-w-0 flex-1 items-start',
          '<div className="flex items-center gap-2">',
          '<div className="space-y-1 text-left">',
        ]);
      }
    }
  });

  it('keeps known rich trigger layouts on spans instead of block elements', () => {
    const advancedDisclosure = readSource(
      'shared/components/forms/AdvancedAssumptionsDisclosure.tsx',
    );
    const secondaryInsight = readSource('shared/components/results/SecondaryInsightAccordion.tsx');
    const referenceGuide = readSource('shared/components/reference/ReferenceGuideRail.tsx');
    const comparisonControls = readSource(
      'features/comparison-engine/components/ComparisonControls.tsx',
    );

    expectContains(advancedDisclosure, '<span className="flex items-start gap-3 text-left">');
    expectContains(secondaryInsight, '<span className="flex min-w-0 flex-1 items-start');
    expectContains(referenceGuide, '<span className="flex items-center gap-2">');
    expectContains(comparisonControls, '<span className="space-y-1 text-left">');

    for (const source of [
      advancedDisclosure,
      secondaryInsight,
      referenceGuide,
      comparisonControls,
    ]) {
      for (const triggerBlock of getAccordionTriggerBlocks(source)) {
        expectNoFragments(triggerBlock, [
          '<h3 className=',
          '<p className="ui-card-title"',
          '<p className="max-w-3xl',
          '<p className="text-sm font-semibold text-foreground"',
          '<p className="text-xs leading-5 text-muted-foreground"',
        ]);
      }
    }
  });
});
