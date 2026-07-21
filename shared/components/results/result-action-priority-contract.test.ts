import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

function read(path: string) {
  return readFileSync(path, 'utf8');
}

describe('result action priority contract', () => {
  it('keeps one primary result action visible and groups secondary actions', () => {
    const source = read('shared/components/results/ResultActionGrid.tsx');
    expect(source).toContain("priority?: 'primary' | 'secondary'");
    expect(source).toContain("action.priority !== 'secondary'");
    expect(source).toContain("action.priority === 'secondary'");
    expect(source).toContain('<details');
    expect(source).toContain("t('bonds.results.more_actions')");
    expect(source).toContain('<summary');
  });

  it('keeps scenario save primary while exports and notebook actions are secondary', () => {
    const source = read('features/single-calculator/components/BondResultsSummary.tsx');
    expect(source).toContain("label: t('common.save')");
    expect(source).toContain("label: t('notebook.add_current_lot')");
    expect(source).toContain("label: t('common.export_pdf')");
    expect(source).toContain("label: t('common.export_csv')");
    expect((source.match(/priority: 'secondary'/g) ?? []).length).toBe(3);
  });

  it('keeps the action group localized', () => {
    const en = read('i18n/translations/en.json');
    const pl = read('i18n/translations/pl.json');
    expect(en).toContain('"more_actions"');
    expect(pl).toContain('"more_actions"');
  });
});
