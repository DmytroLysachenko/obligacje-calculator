import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

function source(relativePath: string) {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

function expectSource(relativePath: string, fragments: string[]) {
  const content = source(relativePath);

  for (const fragment of fragments) {
    expect(content).toContain(fragment);
  }

  return content;
}

function expectNoSource(relativePath: string, fragments: string[]) {
  const content = source(relativePath);

  for (const fragment of fragments) {
    expect(content).not.toContain(fragment);
  }
}

describe('ui primitive visual contracts', () => {
  it('keeps cards compact and flat for financial surfaces', () => {
    const content = expectSource('components/ui/card.tsx', [
      'rounded-lg',
      'border border-border',
      'shadow-none',
      'text-sm/relaxed',
      'text-[15px] font-semibold',
    ]);

    expect(content).not.toContain('ring-1 ring-foreground/10');
    expect(content).not.toContain('rounded-[2rem]');
    expect(content).not.toContain('shadow-xl');
  });

  it('keeps tables separator-led instead of boxed-row heavy', () => {
    const content = expectSource('components/ui/table.tsx', [
      'border-collapse',
      'text-sm',
      'border-border',
      'hover:bg-muted/35',
      'text-xs font-semibold uppercase',
      'px-3 py-2.5',
    ]);

    expect(content).not.toContain('shadow');
    expect(content).not.toContain('rounded-2xl');
    expect(content).not.toContain('border-2');
  });

  it('keeps buttons small-radius and low-shadow by default', () => {
    const content = expectSource('components/ui/button.tsx', [
      'rounded-md',
      'transition-colors',
      'focus-visible:ring-2',
      'bg-primary text-primary-foreground',
      'border-border bg-secondary',
      'size-8',
    ]);

    expect(content).not.toContain('rounded-full');
    expect(content).not.toContain('shadow-lg');
    expect(content).not.toContain('transition-all');
  });

  it('keeps form controls aligned to the same compact radius', () => {
    expectSource('components/ui/input.tsx', [
      'rounded-md',
      'border border-input',
      'bg-background',
      'text-sm',
      'focus-visible:ring-1',
    ]);

    expectSource('components/ui/select.tsx', [
      'rounded-md',
      'border border-input',
      'bg-background',
      'data-[size=default]:min-h-11',
      'data-[size=sm]:min-h-9',
      'py-2.5',
    ]);
  });

  it('keeps select content flat and readable', () => {
    const content = expectSource('components/ui/select.tsx', [
      'rounded-md border border-border',
      'bg-popover text-popover-foreground',
      'shadow-md',
      'focus:bg-muted',
      'px-3 py-2',
    ]);

    expect(content).not.toContain('rounded-[1.2rem]');
    expect(content).not.toContain('shadow-[0_20px_48px');
    expect(content).not.toContain('ring-1 ring-slate-950/5');
  });

  it('keeps badges and tabs quiet enough for dense dashboards', () => {
    expectSource('components/ui/badge.tsx', [
      'rounded-md',
      'transition-colors',
      'focus-visible:ring-1',
      'border-border bg-secondary',
    ]);

    expectSource('components/ui/tabs.tsx', [
      'rounded-md',
      'group-data-[orientation=horizontal]/tabs:h-10',
      'border border-border bg-card',
      'data-[state=active]:bg-muted',
      'text-xs font-semibold',
    ]);
  });

  it('keeps switch and tooltip primitives visually restrained', () => {
    expectSource('components/ui/switch.tsx', [
      'h-5 w-9',
      'border border-border',
      'focus-visible:ring-1',
      'h-4 w-4',
      'shadow-sm',
    ]);

    expectSource('components/ui/tooltip.tsx', ['rounded-md', 'shadow-sm', 'text-xs']);
  });

  it('prevents old decorative primitive styles from coming back', () => {
    expectNoSource('components/ui/input.tsx', ['rounded-none', 'md:text-xs']);
    expectNoSource('components/ui/select.tsx', ['rounded-2xl', 'shadow-[0_10px_24px']);
    expectNoSource('components/ui/switch.tsx', ['h-[24px]', 'w-[44px]', 'shadow-lg']);
    expectNoSource('components/ui/tooltip.tsx', ['rounded-none', 'shadow-md']);
  });
});
