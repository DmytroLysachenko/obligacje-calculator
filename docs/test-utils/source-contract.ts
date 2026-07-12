import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect } from 'vitest';

const root = process.cwd();

export function readSource(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8').replace(/\r\n/g, '\n');
}

export function expectContains(source: string, fragment: string) {
  expect(source).toContain(fragment);
}

export function expectNotContains(source: string, fragment: string) {
  expect(source).not.toContain(fragment);
}

export function expectNoFragments(source: string, fragments: readonly string[]) {
  for (const fragment of fragments) {
    expectNotContains(source, fragment);
  }
}
