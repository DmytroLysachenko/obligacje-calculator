import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

function expectHas(relativePath: string, fragments: string[]) {
  const source = read(relativePath);

  for (const fragment of fragments) {
    expect(source).toContain(fragment);
  }

  return source;
}

describe('app shell visual contracts', () => {
  it('keeps the root content surface flat and token-driven', () => {
    const source = expectHas('app/layout.tsx', [
      'flex min-h-screen bg-background',
      'border-l border-border bg-background',
      'md:px-7 md:py-7',
      'footer className="mt-auto border-t border-border bg-card py-6"',
    ]);

    expect(source).not.toContain('radial-gradient');
    expect(source).not.toContain('backdrop-blur');
    expect(source).not.toContain('border-slate-200/70');
  });

  it('keeps calculator headers dense and typographic', () => {
    const source = expectHas('shared/components/page/CalculatorPageShell.tsx', [
      'space-y-6 pb-14',
      'surface-shell space-y-3 px-4 py-4 md:px-5 md:py-5',
      'ui-page-title',
      'max-w-3xl text-sm leading-6 text-muted-foreground',
      'h-8 gap-2 px-3 text-xs font-medium',
    ]);

    expect(source).not.toContain('rounded-[1.9rem]');
    expect(source).not.toContain('md:rounded-3xl');
    expect(source).not.toContain('md:text-[2.85rem]');
    expect(source).not.toContain('shadow');
  });

  it('keeps the sidebar visually anchored without decorative gradients', () => {
    const source = expectHas('shared/components/chrome/Sidebar.tsx', [
      'bg-[#eeeeea]',
      'border-r border-border',
      'border-l-2 px-3 py-2.5',
      'border-transparent bg-transparent text-muted-foreground',
      'hover:border-border hover:text-foreground',
      'border-foreground bg-transparent text-foreground',
      'space-y-8 overflow-y-auto px-4 py-5',
    ]);

    expect(source).not.toContain('linear-gradient');
    expect(source).not.toContain('rounded-[1.35rem]');
    expect(source).not.toContain('shadow-sky');
    expect(source).not.toContain('border-sky');
    expect(source).not.toContain('hover:bg-card');
    expect(source).not.toContain('text-slate-');
  });

  it('keeps sidebar utility groups simple and compact', () => {
    const source = expectHas('shared/components/chrome/SidebarUtilityGroup.tsx', [
      'border-t border-border',
      'text-xs font-semibold uppercase tracking-[0.08em]',
      'border-y border-border py-1',
      'text-xs leading-5 text-muted-foreground',
    ]);

    expect(source).not.toContain('rounded-[1.6rem]');
    expect(source).not.toContain('border-dashed');
    expect(source).not.toContain('text-slate-500');
    expect(source).not.toContain('rounded-md border border-border bg-card');
  });

  it('keeps sidebar freshness colors semantic', () => {
    const source = expectHas('shared/components/chrome/SidebarSyncSummary.tsx', [
      'text-[var(--finance-success)]',
      'text-[var(--finance-warning)]',
      'inline-flex text-xs font-semibold',
      'text-sm font-semibold text-foreground',
      'text-xs leading-5 text-muted-foreground',
    ]);

    expect(source).not.toContain('bg-emerald-50');
    expect(source).not.toContain('bg-orange-50');
    expect(source).not.toContain('bg-amber-50');
    expect(source).not.toContain('rounded-md border px-2 py-0.5');
  });
});
