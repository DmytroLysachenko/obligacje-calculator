import {describe, expect, it} from 'vitest';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

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

    expectContains(source, 'group block border-l-2 px-3 py-2.5');
    expectContains(source, 'border-foreground bg-transparent text-foreground');
    expectContains(source, 'border-transparent bg-transparent text-muted-foreground hover:border-border hover:text-foreground');
    expectContains(source, 'isActive ? \'bg-transparent text-foreground\' : \'bg-muted/45 text-muted-foreground\'');
    expectContains(source, 'isActive');
    expectContains(source, '? \'text-foreground\'');

    expectNoFragments(source, [
      'rounded-md border px-3 py-2.5',
      'border-border bg-card text-foreground',
      'hover:border-border hover:bg-card hover:text-foreground',
      'bg-foreground text-background',
      'text-slate-500',
      'text-slate-400',
    ]);
  });

  it('keeps sidebar sections spaced enough to scan', () => {
    const source = read(files.sidebar);

    expectContains(source, 'px-2 text-xs font-semibold uppercase tracking-[0.08em]');
    expectContains(source, 'custom-scrollbar flex-1 space-y-8 overflow-y-auto px-4 py-5');
    expectContains(source, 'space-y-4 border-t border-border bg-muted/35 p-4');
    expectContains(source, 'border-b border-border px-4 py-4');

    expectNoFragments(source, [
      'custom-scrollbar flex-1 space-y-5 overflow-y-auto px-3 py-4',
      'space-y-3 border-t border-border bg-muted/35 p-3',
      'border-b border-border px-4 py-3',
    ]);
  });

  it('keeps utility groups divider-led instead of boxed settings cards', () => {
    const source = read(files.utilities);

    expectContains(source, 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3');
    expectContains(source, 'border-t border-border py-3 first:border-t-0 first:pt-0');
    expectContains(source, '<section className="space-y-2">');
    expectContains(source, 'text-xs font-semibold uppercase tracking-[0.08em]');
    expectContains(source, '<div className="border-y border-border py-1">');

    expectNoFragments(source, [
      'rounded-md border border-border bg-card px-3 py-3',
      'border-t border-border px-1 py-3',
      'tracking-[0.06em]',
    ]);
  });

  it('keeps settings utilities as one grouped stack', () => {
    const source = read(files.settings);

    expectContains(source, '<div className="space-y-0">');
    expectContains(source, '<SidebarUtilityRow');
    expectContains(source, 'action={<LanguageSwitcher />}');
    expectContains(source, 'action={<ThemeToggle />}');

    expectNoFragments(source, [
      '<>',
      '</>',
    ]);
  });

  it('keeps sync status visually quiet and semantic', () => {
    const source = read(files.sync);

    expectContains(source, "return 'text-[var(--finance-success)]';");
    expectContains(source, "return 'text-[var(--finance-warning)]';");
    expectContains(source, 'inline-flex text-xs font-semibold');
    expectContains(source, 'text-sm font-semibold text-foreground');

    expectNoFragments(source, [
      'border-[var(--finance-success)]/30 bg-transparent',
      'border-[var(--finance-warning)]/40 bg-transparent',
      'rounded-md border px-2 py-0.5',
      'bg-emerald-50',
      'bg-orange-50',
      'bg-amber-50',
    ]);
  });
});
