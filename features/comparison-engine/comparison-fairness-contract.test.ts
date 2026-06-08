import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';

const projectRoot = process.cwd();

const paths = {
  sharedBase: 'features/comparison-engine/components/ComparisonSharedBaseCard.tsx',
  verdict: 'features/comparison-engine/components/ComparisonVerdict.tsx',
  container: 'features/comparison-engine/components/ComparisonContainer.tsx',
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
  it('keeps maturity mode visible in the setup panel', () => {
    const source = readSource(paths.sharedBase);

    expectContains(source, 'const comparisonMaturityModes: ComparisonMaturityMode[] = [');
    expectContains(source, "'reinvest_until_horizon'");
    expectContains(source, "'hold_to_maturity'");
    expectContains(source, "'cash_after_maturity'");
    expectContains(source, "'align_to_shorter_duration'");
    expectContains(source, 'aria-pressed={activeMaturityMode === mode}');
    expectContains(source, 'className="h-auto min-w-0 justify-start overflow-hidden px-3 py-3 text-left"');
    expectContains(source, 'className="min-w-0 space-y-1 whitespace-normal"');
    expectContains(source, 'className="block max-w-full text-xs font-normal leading-5 opacity-80"');
    expectContains(source, "{t('comparison.fairness.mode_label')}: {t(`comparison.maturity_mode.${activeMaturityMode}.label`)}");
    expectContains(source, 'border-l-2 border-border px-4 py-3');
  });

  it('passes the active maturity mode into the verdict', () => {
    const source = readSource(paths.container);

    expectContains(source, "const maturityMode = sharedConfig.maturityMode ?? 'reinvest_until_horizon';");
    expectContains(source, 'maturityMode={maturityMode}');
    expectContains(source, "t('comparison.duration_mismatch.description'");
  });

  it('explains why a scenario leads instead of only showing a winner', () => {
    const source = readSource(paths.verdict);

    expectContains(source, 'ComparisonMaturityMode');
    expectContains(source, 'function getVerdictDrivers');
    expectContains(source, "t('comparison.verdict.driver_mode'");
    expectContains(source, "t('comparison.verdict.driver_duration'");
    expectContains(source, "t('comparison.verdict.driver_capitalization'");
    expectContains(source, "t('comparison.verdict.driver_inflation'");
    expectContains(source, "t('comparison.verdict.mode_context'");
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
    }
  });
});
