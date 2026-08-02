import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();
const codeRoots = ['app', 'features', 'shared', 'lib'];
const codeExtensions = new Set(['.ts', '.tsx']);

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8').replace(/\r\n/g, '\n');
}

function listCodeFiles(directory: string): string[] {
  const absoluteDirectory = join(root, directory);

  return readdirSync(absoluteDirectory).flatMap((entry) => {
    const absolutePath = join(absoluteDirectory, entry);
    const relativePath = relative(root, absolutePath).replace(/\\/g, '/');
    const stat = statSync(absolutePath);

    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') {
        return [];
      }
      return listCodeFiles(relativePath);
    }

    const extension = relativePath.slice(relativePath.lastIndexOf('.'));
    return codeExtensions.has(extension) ? [relativePath] : [];
  });
}

describe('direct database boundary contract', () => {
  it('keeps direct database access inside data and server persistence boundaries', () => {
    const violations = codeRoots
      .flatMap(listCodeFiles)
      .filter((file) => /from ['"]@\/db['"]/.test(read(file)))
      .filter((file) => !file.endsWith('.test.ts') && !file.endsWith('.test.tsx'))
      .filter(
        (file) =>
          !/^lib\/data\//.test(file) &&
          !/^lib\/sync\//.test(file) &&
          !/^lib\/server\/.+repository\.ts$/.test(file) &&
          file !== 'lib/server/portfolio/access.ts' &&
          file !== 'lib/server/sync/sync-lock.ts',
      );

    expect(violations).toEqual([]);
  });
});
