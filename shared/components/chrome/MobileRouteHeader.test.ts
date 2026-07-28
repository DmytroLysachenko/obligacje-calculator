import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const source = readFileSync(
  join(process.cwd(), 'shared/components/chrome/MobileRouteHeader.tsx'),
  'utf8',
);

describe('MobileRouteHeader feature-status translations', () => {
  it('uses the shared feature-status label namespace', () => {
    for (const status of ['trusted', 'reference', 'conditional', 'experimental', 'limited']) {
      expect(source).toContain(`t('shared.feature_status.labels.${status}')`);
    }
  });
});
