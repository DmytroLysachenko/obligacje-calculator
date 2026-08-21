import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const workflowsDirectory = join(process.cwd(), '.github/workflows');

describe('workflow action pinning', () => {
  it('pins every third-party action to an immutable commit', () => {
    const unpinned = readdirSync(workflowsDirectory)
      .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'))
      .flatMap((file) =>
        readFileSync(join(workflowsDirectory, file), 'utf8')
          .split('\n')
          .filter((line) => /^\s*uses:\s+[^\s]+\/[^\s]+@/.test(line))
          .filter((line) => !/@[a-f0-9]{40}(?:\s|$)/.test(line))
          .map((line) => `${file}: ${line.trim()} `),
      );

    expect(unpinned).toEqual([]);
  });
});
