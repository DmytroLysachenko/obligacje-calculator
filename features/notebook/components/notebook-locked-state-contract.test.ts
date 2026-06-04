import {describe, expect, it} from 'vitest';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const root = process.cwd();

const files = {
  notebook: 'features/notebook/components/NotebookContainer.tsx',
  actions: 'features/notebook/components/WorkspaceActionStrip.tsx',
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

describe('notebook locked and empty state contracts', () => {
  it('keeps the empty notebook state focused on capability preview', () => {
    const source = read(files.notebook);

    expectContains(source, 'capabilitiesTitle');
    expectContains(source, 'capabilities.map((capability)');
    expectContains(source, "t('notebook.capabilities.track.title')");
    expectContains(source, "t('notebook.capabilities.maturities.title')");
    expectContains(source, "t('notebook.capabilities.export.title')");
    expectContains(source, "t('notebook.capabilities.projection.title')");
    expectContains(source, 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]');
    expectContains(source, "import { Notice } from '@/shared/components/feedback/Notice';");
    expectContains(source, 'space-y-4');
    expectContains(source, 'grid gap-x-6 gap-y-4 border-t border-border pt-4 md:grid-cols-2');
    expectContains(source, 'border-t border-border pt-4 first:border-t-0 first:pt-0 md:first:border-t md:first:pt-4');

    expectNoFragments(source, [
      'LegacyEmptyPortfolioState',
      'ready_steps.create.title',
      'ready_steps.store.title',
      'ready_steps.inspect.title',
      'rounded-full border border-border bg-muted/40',
      'space-y-4 rounded-lg border border-border bg-card p-4',
      'rounded-md border border-border bg-muted/20 p-3',
    ]);
  });

  it('keeps guest notebook lock as one clear notice', () => {
    const source = read(files.notebook);

    expectContains(source, 'isGuestWorkspace ? (');
    expectContains(source, "t('workspace.locked_notebook_notice')");
    expectContains(source, '<Notice tone="locked" title={t(\'workspace.sign_in_required_short\')}>');
    expectContains(source, '<Notice tone="locked" title={createLabel}>');
    expectContains(source, 'disabled={!canManageWorkspace}');

    expectNoFragments(source, [
      'Workspace storage is reserved',
      'Anonymous visitors can still inspect',
      'saving lots and managing portfolios stays locked',
      '<Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />',
      'ui-inline-notice',
    ]);
  });

  it('keeps workspace actions prioritized and divider-led', () => {
    const source = read(files.actions);

    expectContains(source, '<section className="space-y-4 border-y border-border py-4">');
    expectContains(source, '<div className="flex flex-wrap gap-2 border-t border-border pt-4">');
    expectContains(source, 'onClick={onCreatePortfolio}');
    expectContains(source, 'onClick={onCreateDemo}');
    expectContains(source, 'variant="ghost"');
    expectContains(source, 'onClick={onImport}');
    expectContains(source, 'onClick={onRefresh}');

    expectNoFragments(source, [
      'rounded-lg border border-border bg-card px-5 py-5',
      'border-t border-dashed border-border',
      'onClick={onImport}\\n          className="gap-2 rounded-md border-border bg-card"',
    ]);
  });

  it('keeps notebook and workspace translations in locale parity', () => {
    const en = read(files.en);
    const pl = read(files.pl);

    for (const source of [en, pl]) {
      expectContains(source, '"capabilities_title"');
      expectContains(source, '"capabilities"');
      expectContains(source, '"track"');
      expectContains(source, '"maturities"');
      expectContains(source, '"export"');
      expectContains(source, '"projection"');
      expectContains(source, '"locked_notebook_notice"');
    }
  });
});
