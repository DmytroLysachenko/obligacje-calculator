import {describe, expect, it} from 'vitest';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const root = process.cwd();

const paths = {
  page: 'app/education/EducationClient.tsx',
  card: 'features/education/components/BondEducationCard.tsx',
  en: 'i18n/translations/en.json',
  pl: 'i18n/translations/pl.json',
} as const;

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
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

    expectNoFragments(source, [
      'rounded-lg border',
      'shadow-xl',
      'bg-gradient',
      'hero',
    ]);
  });

  it('keeps starter guidance section divider-led and dense', () => {
    const source = read(paths.page);

    expectContains(source, '<section className="space-y-5 border-t border-border py-6">');
    expectContains(source, 'grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 xl:grid-cols-4');
    expectContains(source, '<article key={guide.key} className="border-t border-border py-4">');
    expectContains(source, 'text-[32px] font-semibold leading-none text-foreground');
    expectContains(source, 'ui-body mt-3 text-muted-foreground');

    expectNoFragments(source, [
      'surface-panel',
      'rounded-md border border-border',
      'grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4',
    ]);
  });

  it('keeps bond offer cards free of badge component shells', () => {
    const source = read(paths.card);

    expectContains(source, "import Link from 'next/link';");
    expectContains(source, 'surface-chip border-foreground text-foreground');
    expectContains(source, 'surface-chip text-foreground');
    expectContains(source, "t('education.calculate_this_bond')");
    expectContains(source, '<ArrowRight className="h-4 w-4" />');

    expectNoFragments(source, [
      "import { Badge } from '@/components/ui/badge';",
      '<Badge',
      '</Badge>',
      'rounded-lg border',
      'bg-card',
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
