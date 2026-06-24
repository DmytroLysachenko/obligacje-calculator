import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

describe('tool card page primitive', () => {
  it('keeps route cards border-led instead of boxed-card-led', () => {
    const source = read('shared/components/page/ToolCard.tsx');

    expect(source).toContain('export function ToolCard');
    expect(source).toContain("emphasis?: 'primary' | 'secondary' | 'reference';");
    expect(source).toContain('border-t border-border py-5');
    expect(source).toContain('ui-focus-ring');
    expect(source).not.toContain('rounded-lg border border-border bg-card p-5 shadow-sm');
  });

  it('routes the landing dashboard through the shared tool card', () => {
    const source = read('app/LandingDashboardClient.tsx');

    expect(source).toContain(
      "import { SectionHeading, ToolCard } from '@/shared/components/page/ToolCard';",
    );
    expect(source).toContain('<ToolCard');
    expect(source).not.toContain('rounded-lg border border-border bg-card p-5 shadow-sm');
  });
});
