import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();
const docsRoot = join(root, 'docs');

function markdownFiles(directory: string): string[] {
  return readdirSync(directory)
    .flatMap((entry) => {
      const path = join(directory, entry);
      return statSync(path).isDirectory() ? markdownFiles(path) : [path];
    })
    .filter((path) => path.endsWith('.md'));
}

function localMarkdownTargets(sourcePath: string) {
  const source = readFileSync(sourcePath, 'utf8');
  const targets = [...source.matchAll(/\[[^\]]*]\(([^)]+)\)/g)].map((match) =>
    match[1].trim().replace(/^<|>$/g, ''),
  );

  return targets
    .filter((target) => !target.startsWith('#'))
    .filter((target) => !/^[a-z][a-z\d+.-]*:/i.test(target))
    .map((target) => decodeURIComponent(target.split('#', 1)[0]))
    .filter(Boolean);
}

describe('documentation integrity', () => {
  it('keeps local Markdown links resolvable', () => {
    const brokenLinks = markdownFiles(docsRoot).flatMap((sourcePath) =>
      localMarkdownTargets(sourcePath)
        .map((target) => resolve(dirname(sourcePath), target))
        .filter((target) => !existsSync(target))
        .map((target) => `${relative(root, sourcePath)} -> ${relative(root, target)}`),
    );

    expect(brokenLinks).toEqual([]);
  });

  it('indexes every active plan without exposing archived plans as active', () => {
    const docsIndex = readFileSync(join(docsRoot, 'index.md'), 'utf8');
    const archiveIndex = readFileSync(join(docsRoot, 'archive/plans/index.md'), 'utf8');
    const activePlans = readdirSync(join(docsRoot, 'plans')).filter((file) => file.endsWith('.md'));
    const archivedPlans = readdirSync(join(docsRoot, 'archive/plans')).filter(
      (file) => file.endsWith('.md') && file !== 'index.md',
    );

    for (const plan of activePlans) {
      expect(docsIndex).toContain(`./plans/${plan}`);
    }

    for (const plan of archivedPlans) {
      expect(archiveIndex).toContain(plan);
      expect(docsIndex).not.toContain(`./plans/${plan}`);
    }
  });
});
