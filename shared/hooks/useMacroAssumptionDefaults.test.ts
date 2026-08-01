import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

describe('useMacroAssumptionDefaults', () => {
  it('keeps the server data barrel out of the client bundle', () => {
    const source = readFileSync(join(root, 'shared/hooks/useMacroAssumptionDefaults.ts'), 'utf8');

    expect(source).toContain(
      "import type { MacroAssumptionDefaults } from '@/lib/data/market-data'",
    );
    expect(source).not.toContain(
      "import { MacroAssumptionDefaults } from '@/lib/data/market-data'",
    );
  });
});
