import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

function read(path: string) {
  return readFileSync(path, 'utf8');
}

describe('calculator responsive layout contract', () => {
  const layout = () => read('shared/components/page/layout-system.ts');

  it('keeps the calculator single-column until there is room for both dense panels', () => {
    const source = layout();
    const grid = source.match(/calculatorGrid:\s*'([^']+)'/)?.[1] ?? '';

    expect(grid).toContain('grid-cols-1');
    expect(grid).toContain('2xl:grid-cols-[420px_minmax(0,1fr)]');
    expect(grid).not.toContain(' xl:grid-cols');
  });

  it('keeps the scenario controls sticky only in the wide two-panel layout', () => {
    const source = layout();
    const sticky = source.match(/stickyScenario:\s*'([^']+)'/)?.[1] ?? '';

    expect(sticky).toContain('2xl:sticky');
    expect(sticky).toContain('2xl:top-8');
    expect(sticky).toContain('2xl:h-fit');
    expect(sticky).not.toContain(' xl:sticky');
  });

  it('reserves enough page space for the mobile calculation action', () => {
    const source = layout();

    expect(source).toContain('mobileActionSpace');
    expect(source).toContain('env(safe-area-inset-bottom)');
    expect(source).toContain('lg:pb-0');
  });

  it('applies the mobile action space to every calculator shell', () => {
    const source = read('shared/components/page/CalculatorPageShell.tsx');

    expect(source).toContain('pageLayout.mobileActionSpace');
    expect(source).toContain('pageLayout.pageFlow');
  });

  it('anchors the floating action above mobile safe areas', () => {
    const source = read('shared/components/feedback/RecalculateButton.tsx');

    expect(source).toContain('env(safe-area-inset-bottom)');
    expect(source).toContain('backdrop-blur-sm');
    expect(source).toContain('bg-background/95');
    expect(source).toContain('role="status"');
    expect(source).toContain('aria-live="polite"');
  });
});
