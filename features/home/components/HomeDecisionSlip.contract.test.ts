import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const source = readFileSync(
  join(process.cwd(), 'features/home/components/HomeDecisionSlip.tsx'),
  'utf8',
);

describe('HomeDecisionSlip', () => {
  it('lets a visitor choose an intent before navigating to a tool', () => {
    expect(source).toContain('useState(homeDecisionRoutes[0]?.id)');
    expect(source).toContain('aria-pressed={selectedId === item.id}');
    expect(source).toContain('onClick={() => setSelectedId(item.id)}');
    expect(source).toContain('selectedRoute.href');
  });

  it('keeps the selected route explanatory and keyboard reachable', () => {
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('ui-focus-ring');
    expect(source).toContain('min-h-11');
    expect(source).toContain('landing.home_routes.primary_action');
  });
});
