import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

const paths = {
  page: 'app/education/EducationClient.tsx',
  card: 'features/education/components/BondEducationCard.tsx',
  en: 'i18n/translations/en.json',
  pl: 'i18n/translations/pl.json',
} as const;

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8').replace(/\r\n/g, '\n');
}

function expectContains(source: string, fragment: string) {
  expect(source).toContain(fragment);
}

function expectNotContains(source: string, fragment: string) {
  expect(source).not.toContain(fragment);
}

function expectNoFragments(source: string, fragments: readonly string[]) {
  for (const fragment of fragments) {
    expectNotContains(source, fragment);
  }
}

describe('education entry layout contracts', () => {
  it('keeps education page as a calculator entry flow', () => {
    const source = read(paths.page);

    expectContains(source, 'const starterGuides = [');
    expectContains(source, "key: 'short_term'");
    expectContains(source, "key: 'inflation'");
    expectContains(source, "key: 'family'");
    expectContains(source, "key: 'long_term'");
    expectContains(source, 'href="/single-calculator"');
    expectContains(source, "t('education.starter_title')");
    expectContains(source, "t('education.starter_cta')");
    expectContains(source, "t('education.bond_types_subtitle')");

    expectNoFragments(source, ['shadow-xl', 'bg-gradient', 'hero']);
  });

  it('keeps starter guidance section grouped and dense', () => {
    const source = read(paths.page);

    expectContains(source, "import { SectionBlock } from '@/shared/components/page/SectionBlock';");
    expectContains(source, '<SectionBlock');
    expectContains(source, "title={t('education.starter_title')}");
    expectContains(source, 'space-y-14 pb-12 md:space-y-16');
    expectContains(source, 'grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 xl:grid-cols-4');
    expectContains(source, '<article key={guide.key} className="border-t border-border py-5">');
    expectContains(source, 'text-[32px] font-semibold leading-none text-foreground');
    expectContains(source, 'ui-body mt-3 text-muted-foreground');

    expectNoFragments(source, [
      'surface-panel',
      '<section className="surface-shell space-y-5 p-5 md:p-6">',
      '<article key={guide.key} className="rounded-lg border border-border bg-card p-4">',
      'space-y-12 pb-12 md:space-y-14',
      'grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 xl:grid-cols-4',
      '<article key={guide.key} className="border-t border-border py-4">',
      'grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4',
      'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4',
    ]);
  });

  it('keeps bond offer cards grouped without shadcn badge shells', () => {
    const source = read(paths.card);

    expectContains(source, "import Link from 'next/link';");
    expectContains(source, 'surface-chip border-foreground text-foreground');
    expectContains(source, 'surface-chip text-foreground');
    expectContains(source, 'border-t border-border py-6');
    expectContains(source, 'flex flex-1 flex-col space-y-5 pt-5');
    expectContains(source, 'mt-auto space-y-5 pt-6');
    expectContains(
      source,
      '<dl className="grid min-h-[132px] grid-cols-1 gap-x-4 divide-y divide-border border-y border-border',
    );
    expectContains(
      source,
      "import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';",
    );
    expectContains(source, '<FormInlineNotice');
    expectContains(source, "t('education.calculate_this_bond')");
    expectContains(source, '<ArrowRight className="h-4 w-4" />');

    expectNoFragments(source, [
      "import { Badge } from '@/components/ui/badge';",
      "import { Notice } from '@/shared/components/feedback/Notice';",
      '<Badge',
      '</Badge>',
      'border-t border-border py-5',
      'flex-1 space-y-4 pt-4',
      'mt-auto space-y-4 pt-1',
      'rounded-lg border border-border bg-card p-5 shadow-sm',
      'rounded-lg border border-border bg-muted/20 p-4',
      'rounded-md border border-warning/30 bg-warning/5',
    ]);
  });

  it('keeps offer cards connected to the calculator without mutating scenarios', () => {
    const source = read(paths.card);

    expectContains(source, 'href="/single-calculator"');
    expectContains(source, 'inline-flex h-9 items-center gap-2 border-b border-foreground');

    expectNoFragments(source, [
      '?bondType=',
      '?bond=',
      'replaceInputs',
      'setBondType',
      'localStorage',
    ]);
  });

  it('keeps education translations in parity for the starter flow', () => {
    const en = read(paths.en);
    const pl = read(paths.pl);

    for (const source of [en, pl]) {
      expectContains(source, '"starter_title"');
      expectContains(source, '"starter_subtitle"');
      expectContains(source, '"starter_cta"');
      expectContains(source, '"bond_types_subtitle"');
      expectContains(source, '"calculate_this_bond"');
      expectContains(source, '"starter"');
      expectContains(source, '"short_term"');
      expectContains(source, '"inflation"');
      expectContains(source, '"family"');
      expectContains(source, '"long_term"');
    }
  });
});
