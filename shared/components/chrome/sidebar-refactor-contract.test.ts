import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const files = {
  sidebar: 'shared/components/chrome/Sidebar.tsx',
  utilities: 'shared/components/chrome/SidebarUtilityGroup.tsx',
  settings: 'shared/components/chrome/SidebarSettingsUtility.tsx',
  sync: 'shared/components/chrome/SidebarSyncSummary.tsx',
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

describe('sidebar refactor contracts', () => {
  it('keeps active navigation subtle with a left-border cue', () => {
    const source = read(files.sidebar);

    expectContains(source, 'group relative block rounded-md px-3 py-2.5');
    expectContains(source, 'bg-card text-foreground shadow-sm');
    expectContains(source, 'before:absolute before:left-0 before:top-1/2 before:h-6 before:w-0.5');
    expectContains(
      source,
      'bg-transparent text-muted-foreground hover:bg-card/70 hover:text-foreground',
    );
    expectContains(
      source,
      "isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'",
    );
    expectContains(source, 'isActive');
    expectContains(source, "? 'text-foreground'");

    expectNoFragments(source, [
      'rounded-md border px-3 py-2.5',
      'border-border bg-card text-foreground',
      'text-slate-500',
      'text-slate-400',
    ]);
  });

  it('keeps sidebar sections spaced enough to scan', () => {
    const source = read(files.sidebar);

    expectContains(source, 'px-2 text-xs font-semibold uppercase tracking-[0.08em]');
    expectContains(source, 'custom-scrollbar flex-1 space-y-7 overflow-y-auto px-3 py-5');
    expectContains(source, 'space-y-4 border-t border-border bg-muted/20 px-3 py-4');
    expectContains(source, 'border-b border-border px-4 py-4');
    expectContains(source, 'w-[var(--sidebar-width)]');
    expectContains(source, 'bg-secondary/70');
    expectContains(
      source,
      'border-t border-border px-0.5 pt-3 text-xs leading-5 text-muted-foreground',
    );

    expectNoFragments(source, [
      'custom-scrollbar flex-1 space-y-5 overflow-y-auto px-3 py-4',
      'space-y-4 border-t border-border bg-muted/30 p-3',
      'space-y-3 border-t border-border bg-muted/35 p-3',
      'space-y-3 border-t border-border bg-muted/25 p-2.5',
      'border-b border-border px-4 py-3',
    ]);
  });

  it('keeps utility groups divider-led instead of boxed settings cards', () => {
    const source = read(files.utilities);

    expectContains(source, 'grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-1');
    expectContains(source, 'border-t border-border py-3.5 first:border-t-0 first:pt-0');
    expectContains(source, "flush ? 'first:border-t-0'");
    expectContains(source, 'export function SidebarUtilityStack');
    expectContains(source, 'divide-y divide-border');
    expectContains(source, '<section className="space-y-2.5">');
    expectContains(source, 'text-xs font-semibold uppercase tracking-[0.08em]');
    expectContains(source, '<div className="border-y border-border py-1">');
    expectContains(source, 'line-clamp-2 text-[11px] leading-4 text-muted-foreground');
    expectContains(source, 'text-xs font-semibold text-foreground');

    expectNoFragments(source, [
      'rounded-md border border-border bg-card px-3 py-3',
      'border-t border-border px-1 py-3',
      'border-t border-border py-3 first:border-t-0 first:pt-0',
      '<section className="space-y-2">',
      '<section className="space-y-1.5">',
      '<div className="border-y border-border py-0.5">',
      'tracking-[0.06em]',
    ]);
  });

  it('keeps settings utilities as one grouped stack', () => {
    const source = read(files.settings);

    expectContains(
      source,
      "import { SidebarUtilityPanel, SidebarUtilityRow, SidebarUtilityStack } from './SidebarUtilityGroup';",
    );
    expectContains(source, '<SidebarUtilityStack>');
    expectContains(source, '<SidebarUtilityPanel flush>');
    expectContains(source, '<SidebarUtilityRow');
    expectContains(source, 'action={<LanguageSwitcher />}');
    expectNotContains(source, 'ThemeToggle');
    expectNotContains(source, 'description="PL / EN"');

    expectNoFragments(source, [
      '<div className="space-y-3">',
      '<div className="space-y-0">',
      'mt-3.5 border-t border-border pt-3.5',
      'mt-2.5 border-t border-border pt-2.5',
      '<>',
      '</>',
      "<SidebarUtilityPanel>\n        <SidebarUtilityRow\n          title={t('common.theme')}",
    ]);
  });

  it('keeps sync status visually quiet and semantic', () => {
    const source = read(files.sync);

    expectContains(source, "return 'text-[var(--finance-success)]';");
    expectContains(source, "return 'text-[var(--finance-warning)]';");
    expectContains(source, 'inline-flex text-xs font-semibold');
    expectContains(source, "aria-label={`${t('common.sync_data')}: ${freshnessLabel}`}");
    expectContains(source, 'text-sm font-semibold text-foreground');
    expectContains(source, 'max-w-[14rem] text-[11px] leading-5 text-muted-foreground');
    expectContains(source, 'flex items-start justify-between gap-4');
    expectContains(source, '<div className="space-y-2">');
    expectContains(
      source,
      "import { getFreshnessDisplayState } from '@/shared/lib/data-freshness-display';",
    );
    expectContains(source, 'const { lastSyncLabel } = getFreshnessDisplayState(');
    expectContains(source, "{t('sidebar.freshness.reference_label')}");
    expectContains(source, "{freshnessLabel ?? t('sidebar.freshness.no_metadata')}");
    expectContains(source, "{t('sidebar.freshness.last_checked')}: {lastSyncLabel}");

    expectNoFragments(source, [
      'border-[var(--finance-success)]/30 bg-transparent',
      'border-[var(--finance-warning)]/40 bg-transparent',
      'rounded-md border px-2 py-0.5',
      'text-xs leading-5 text-muted-foreground',
      'line-clamp-2 text-[11px] leading-4 text-muted-foreground',
      'flex items-start justify-between gap-3',
      "dataFreshness.asOf ?? t('sidebar.freshness.no_date')",
      'dataFreshness?.lastSyncedAt ?? dataFreshness?.lastCheck',
      'bg-emerald-50',
      'bg-orange-50',
      'bg-amber-50',
    ]);
  });

  it('keeps freshness copy calm instead of alarming', () => {
    const en = read('i18n/translations/en.json');
    const pl = read('i18n/translations/pl.json');

    expectContains(en, '"caution": "Review"');
    expectContains(en, '"text_caution": "Reference data may need a closer freshness check."');
    expectContains(pl, '"caution": "Do przegladu"');
    expectContains(pl, '"text_caution": "Sprawdz swiezosc danych referencyjnych przed wnioskami."');
    expectNoFragments(en, ['"caution": "Caution"', 'Read reference pages more cautiously.']);
    expectNoFragments(pl, ['"caution": "Ostroznie"', 'Czytaj strony pomocnicze ostrozniej.']);
  });
});
