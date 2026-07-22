import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

function expectContains(source: string, fragment: string) {
  expect(source).toContain(fragment);
}

function expectNoFragments(source: string, fragments: readonly string[]) {
  for (const fragment of fragments) {
    expect(source).not.toContain(fragment);
  }
}

describe('scenario override controls contract', () => {
  it('keeps override controls aligned with shared form surfaces', () => {
    const source = read('features/comparison-engine/components/ScenarioOverrideCard.tsx');

    expectContains(
      source,
      "import { FormSelect, FormSelectOption } from '@/shared/components/forms/FormSelect';",
    );
    expectContains(source, '<ScenarioSetupCard');
    expectContains(source, 'triggerClassName="h-12 font-semibold"');
    expectContains(source, "description={t('comparison.scenario_card_desc')}");
    expectContains(source, "t('comparison.base_follows_shared_title')");
    expectContains(source, 'checked={customHorizonEnabled}');
    expect(source).not.toContain('isRebought?: boolean');
    expect(source).not.toContain('<Switch checked={!!isRebought}');

    expectNoFragments(source, [
      'rounded-full bg-muted px-2 py-0.5',
      'rounded-full bg-warning/10 px-2 py-0.5',
      'rounded-full border border-border bg-muted/30',
      'triggerClassName="bg-card font-semibold"',
      'rounded-lg border border-border bg-muted/20 px-3 py-3',
      'flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/20',
      '<RateContextNote',
      '<FormInlineNotice',
    ]);
  });
});
