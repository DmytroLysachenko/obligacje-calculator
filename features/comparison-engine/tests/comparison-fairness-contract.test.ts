import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

const paths = {
  sharedBase: 'features/comparison-engine/components/ComparisonSharedBaseCard.tsx',
  verdict: 'features/comparison-engine/components/ComparisonVerdict.tsx',
  container: 'features/comparison-engine/components/ComparisonContainer.tsx',
  containerPanels: 'features/comparison-engine/components/ComparisonContainerPanels.tsx',
  en: 'i18n/translations/en.json',
  pl: 'i18n/translations/pl.json',
} as const;

function readSource(relativePath: string) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

function expectContains(source: string, fragment: string) {
  expect(source).toContain(fragment);
}

describe('comparison fairness contracts', () => {
  it('removes legacy maturity mode controls from the setup panel', () => {
    const source = readSource(paths.sharedBase);

    expect(source).not.toContain('comparisonMaturityModes');
    expect(source).not.toContain('activeMaturityMode');
    expect(source).not.toContain("onUpdateSharedConfig('maturityMode'");
    expect(source).not.toContain("t('bonds.inflation.adjusted')");
  });

  it('passes automatic rollover fairness copy into the comparison surface', () => {
    const source = `${readSource(paths.container)}\n${readSource(paths.containerPanels)}`;

    expectContains(source, "t('comparison.auto_rollover_notice')");
    expectContains(source, "t('comparison.auto_rollover_notice_title')");
    expectContains(source, "t('comparison.auto_rollover_fairness_desc')");
    expectContains(source, "t('comparison.auto_rollover_mode_label')");
    expectContains(source, '<Notice tone="info"');
    expect(source).not.toContain(
      '<Notice tone="warning" title={t(\'comparison.duration_mismatch.title\')}>',
    );
    expect(source).not.toContain('maturityMode={maturityMode}');
  });

  it('explains why a scenario leads instead of only showing a winner', () => {
    const source = readSource(paths.verdict);

    expectContains(source, 'function getVerdictDrivers');
    expectContains(source, "t('comparison.verdict.driver_mode'");
    expectContains(source, "t('comparison.verdict.driver_duration'");
    expectContains(source, "t('comparison.verdict.driver_capitalization'");
    expectContains(source, "t('comparison.verdict.driver_inflation'");
    expectContains(source, "t('comparison.verdict.mode_context'");
    expectContains(source, "t('comparison.auto_rollover_mode_label')");
    expectContains(source, "t('comparison.verdict.drivers_title')");
  });

  it('keeps comparison fairness copy available in both locales', () => {
    const en = readSource(paths.en);
    const pl = readSource(paths.pl);

    for (const source of [en, pl]) {
      expectContains(source, '"mode_context"');
      expectContains(source, '"drivers_title"');
      expectContains(source, '"driver_mode"');
      expectContains(source, '"driver_duration"');
      expectContains(source, '"driver_capitalization"');
      expectContains(source, '"driver_inflation"');
      expectContains(source, '"auto_rollover_mode_label"');
      expectContains(source, '"auto_rollover_fairness_desc"');
      expectContains(source, '"auto_rollover_notice_title"');
      expectContains(source, '"auto_rollover_notice"');
    }
  });
});
