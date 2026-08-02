import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const source = readFileSync(
  join(process.cwd(), 'shared/components/charts/ChartDataTable.tsx'),
  'utf8',
);

describe('ChartDataTable mobile reading contract', () => {
  it('offers a stacked definition-list reading mode before the wide table', () => {
    expect(source).toContain('className="md:hidden"');
    expect(source).toContain('className="divide-y divide-border"');
    expect(source).toContain('<dl className="grid grid-cols-1');
    expect(source).toContain('tabular-nums text-foreground');
  });

  it('keeps the semantic table for desktop and keyboard horizontal scrolling', () => {
    expect(source).toContain('className="hidden overflow-x-auto md:block" tabIndex={0}');
    expect(source).toContain('<table className="w-full min-w-[34rem]');
    expect(source).toContain('<caption className="sr-only">');
  });
});
