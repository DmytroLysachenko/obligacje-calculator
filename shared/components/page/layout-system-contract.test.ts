import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';

const projectRoot = process.cwd();

const paths = {
  globals: 'app/globals.css',
  layout: 'app/layout.tsx',
  shell: 'shared/components/page/CalculatorPageShell.tsx',
  section: 'shared/components/page/CalculatorSection.tsx',
  frame: 'shared/components/page/PageFrame.tsx',
  tokens: 'shared/components/page/layout-system.ts',
  fallback: 'shared/components/page/PageSuspenseFallback.tsx',
} as const;

function readSource(relativePath: string) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

function expectContains(source: string, fragment: string) {
  expect(source).toContain(fragment);
}

function expectNotContains(source: string, fragment: string) {
  expect(source).not.toContain(fragment);
}

describe('layout system contracts', () => {
  it('defines reusable width and spacing tokens in css and TypeScript', () => {
    const globals = readSource(paths.globals);
    const tokens = readSource(paths.tokens);

    expectContains(globals, '--layout-reading-max: 720px;');
    expectContains(globals, '--layout-content-max: 1120px;');
    expectContains(globals, '--layout-wide-max: 1280px;');
    expectContains(globals, '--layout-app-max: 1320px;');
    expectContains(globals, '.ui-page-flow');
    expectContains(globals, '.ui-section-flow');
    expectContains(globals, '.ui-section-divider');

    expectContains(tokens, "pageFlow: 'space-y-12 pb-16 md:space-y-16'");
    expectContains(tokens, "calculatorGrid: 'grid grid-cols-1 gap-8 xl:grid-cols-[400px_minmax(0,1fr)] xl:items-start xl:gap-10'");
    expectContains(tokens, "stickyScenario: 'space-y-6 xl:sticky xl:top-24 xl:h-fit'");
  });

  it('keeps root content and footer aligned to the same app width', () => {
    const source = readSource(paths.layout);

    expectContains(source, 'max-w-[var(--layout-app-max)]');
    expectContains(source, 'px-4 py-6 md:px-8 md:py-8');
    expectNotContains(source, 'container mx-auto max-w-[1320px]');
  });

  it('uses section rhythm in shared calculator shell and sections', () => {
    const shell = readSource(paths.shell);
    const section = readSource(paths.section);

    expectContains(shell, 'className={pageLayout.pageFlow}');
    expectContains(shell, 'border-b border-border pb-8 md:pb-10');
    expectContains(shell, 'max-w-[var(--layout-reading-max)]');
    expectNotContains(shell, 'surface-shell space-y-3 px-4 py-4');

    expectContains(section, 'pageLayout.sectionFlow');
    expectContains(section, 'pageLayout.sectionDivider');
    expectContains(section, 'max-w-[var(--layout-reading-max)] text-muted-foreground');
  });

  it('provides reusable frame primitives for report-driven page work', () => {
    const source = readSource(paths.frame);

    expectContains(source, 'export function PageFrame');
    expectContains(source, 'export function SectionBlock');
    expectContains(source, "width?: 'wide' | 'content' | 'reading';");
    expectContains(source, "flow?: 'page' | 'compact' | 'section' | 'none';");
  });

  it('keeps loading states section-led instead of card-led', () => {
    const source = readSource(paths.fallback);

    expectContains(source, 'pageLayout.sectionFlow');
    expectContains(source, 'space-y-3 border-b border-border pb-8');
    expectNotContains(source, 'rounded-lg border border-border bg-card p-6');
    expectNotContains(source, 'surface-panel h-[200px]');
    expectNotContains(source, 'surface-soft h-[160px]');
  });
});
