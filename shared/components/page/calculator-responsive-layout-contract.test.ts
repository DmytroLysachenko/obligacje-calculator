import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

function read(path: string) {
  return readFileSync(path, 'utf8');
}

describe('calculator responsive layout contract', () => {
  const layout = () => read('shared/components/page/layout-system.ts');

  it('introduces a tablet calculator split before the widest desktop breakpoint', () => {
    const source = layout();
    const grid = source.match(/calculatorGrid:\s*'([^']+)'/)?.[1] ?? '';

    expect(grid).toContain('grid-cols-1');
    expect(grid).toContain('lg:grid-cols-[minmax(19rem,0.72fr)_minmax(0,1.28fr)]');
    expect(grid).toContain('xl:grid-cols-[420px_minmax(0,1fr)]');
    expect(grid.indexOf('lg:grid-cols')).toBeLessThan(grid.indexOf('xl:grid-cols'));
  });

  it('keeps the scenario controls sticky from tablet widths upward', () => {
    const source = layout();
    const sticky = source.match(/stickyScenario:\s*'([^']+)'/)?.[1] ?? '';

    expect(sticky).toContain('lg:sticky');
    expect(sticky).toContain('lg:top-8');
    expect(sticky).toContain('lg:h-fit');
    expect(sticky).not.toContain('xl:sticky');
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
