import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();
const sourceRoots = ['app', 'components', 'features', 'shared'];

function productionSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return productionSourceFiles(path);
    return /(?<!\.test)\.(?:ts|tsx)$/.test(entry) ? [path] : [];
  });
}

describe('motion policy', () => {
  it('prohibits transition-all in production UI source', () => {
    const offenders = sourceRoots.flatMap((sourceRoot) =>
      productionSourceFiles(join(root, sourceRoot)).filter((path) =>
        readFileSync(path, 'utf8').includes('transition-all'),
      ),
    );

    expect(offenders).toEqual([]);
  });

  it('keeps the global reduced-motion override available to every route', () => {
    const globals = readFileSync(join(root, 'app/globals.css'), 'utf8');

    expect(globals).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('keeps a visible focus treatment when shared primitives suppress native outlines', () => {
    const primitiveFiles = [
      'components/ui/accordion.tsx',
      'components/ui/button.tsx',
      'components/ui/input.tsx',
      'components/ui/select.tsx',
      'components/ui/slider.tsx',
      'components/ui/switch.tsx',
      'components/ui/tabs.tsx',
    ];

    for (const relativePath of primitiveFiles) {
      const source = readFileSync(join(root, relativePath), 'utf8');
      if (source.includes('outline-none')) {
        expect(source, relativePath).toContain('focus-visible:ring');
      }
    }
  });
});
