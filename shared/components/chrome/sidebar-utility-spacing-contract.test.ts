import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

const files = {
  sidebar: 'shared/components/chrome/Sidebar.tsx',
  utilities: 'shared/components/chrome/SidebarUtilityGroup.tsx',
  settings: 'shared/components/chrome/SidebarSettingsUtility.tsx',
  sync: 'shared/components/chrome/SidebarSyncSummary.tsx',
  workspace: 'shared/components/chrome/SidebarWorkspaceUtility.tsx',
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

describe('sidebar utility spacing contracts', () => {
  it('keeps the footer less cramped without introducing card wrappers', () => {
    const source = read(files.sidebar);

    expectContains(source, 'space-y-4 border-t border-border bg-muted/20 px-3 py-4');
    expectContains(source, '<SidebarUtilityGroup title={t(\'common.settings\')}>');
    expectContains(source, '<SidebarSettingsUtility />');
    expectContains(source, '<SidebarSyncSummary dataFreshness={dataFreshness} />');
    expectContains(source, 'border-t border-border px-0.5 pt-3 text-xs leading-5 text-muted-foreground');

    expectNoFragments(source, [
      'space-y-3 border-t border-border bg-muted/25 p-2.5',
      'space-y-3 border-t border-border bg-muted/35 p-3',
      'rounded-md border border-border bg-card',
      'shadow-md',
      'backdrop-blur',
    ]);
  });

  it('keeps every sidebar utility row on a stable scan height', () => {
    const source = read(files.utilities);

    expectContains(source, 'export function SidebarUtilityRow');
    expectContains(source, 'emphasis = false');
    expectContains(source, 'grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-1');
    expectContains(source, 'min-w-0 space-y-1');
    expectContains(source, "emphasis ? 'text-xs font-semibold text-foreground'");
    expectContains(source, 'line-clamp-2 text-[11px] leading-4 text-muted-foreground');
    expectContains(source, 'border-t border-border py-3.5 first:border-t-0 first:pt-0');
    expectContains(source, "flush ? 'first:border-t-0'");
    expectContains(source, 'export function SidebarUtilityStack');
    expectContains(source, 'divide-y divide-border');

    expectNoFragments(source, [
      'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3',
      'border-t border-border py-2.5 first:border-t-0 first:pt-0',
      '<section className="space-y-1.5">',
      '<div className="border-y border-border py-0.5">',
    ]);
  });

  it('keeps language as the only visible settings control until theme is fully designed', () => {
    const source = read(files.settings);

    expectContains(source, '<SidebarUtilityStack>');
    expectContains(source, '<SidebarUtilityPanel flush>');
    expectContains(source, 'title={t(\'common.language\')}');
    expectContains(source, 'action={<LanguageSwitcher />}');
    expectNotContains(source, 'description="PL / EN"');
    expectNotContains(source, 'ThemeToggle');
    expectNotContains(source, 'title={t(\'common.theme\')}');

    expectNoFragments(source, [
      'mt-3.5 border-t border-border pt-3.5',
      'mt-2.5 border-t border-border pt-2.5',
      '<div className="space-y-3">',
      '<div className="space-y-0">',
    ]);
  });

  it('keeps sync copy readable in the sidebar footer', () => {
    const source = read(files.sync);

    expectContains(source, '<div className="space-y-2">');
    expectContains(source, 'flex items-start justify-between gap-4');
    expectContains(source, 'mt-1 text-sm font-semibold text-foreground');
    expectContains(source, 'max-w-[14rem] text-[11px] leading-5 text-muted-foreground');

    expectNoFragments(source, [
      '<div className="space-y-1">',
      'flex items-start justify-between gap-3',
      'mt-0.5 text-sm font-semibold text-foreground',
      'line-clamp-2 text-[11px] leading-4 text-muted-foreground',
    ]);
  });

  it('keeps the optional workspace utility aligned to the same rhythm', () => {
    const source = read(files.workspace);

    expectContains(source, '<SidebarUtilityPanel>');
    expectContains(source, '<div className="space-y-4">');
    expectContains(source, 'border-l border-border pl-3.5');
    expectContains(source, '<FormSelect');
    expectContains(source, 'className="h-9 w-full rounded-md border-border bg-card text-sm"');

    expectNoFragments(source, [
      '<div className="space-y-3">',
      'border-l-2 border-border pl-3',
      'rounded-lg',
      'shadow',
    ]);
  });
});
