import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const sources = {
  inputs: 'features/single-calculator/components/BondInputsForm.tsx',
  summary: 'features/single-calculator/components/BondResultsSummary.tsx',
  formField: 'shared/components/forms/FormField.tsx',
  actionGrid: 'shared/components/results/ResultActionGrid.tsx',
  config: 'features/single-calculator/components/sections/BondConfigSection.tsx',
  moneyInput: 'shared/components/forms/MoneyInput.tsx',
  sliderInput: 'shared/components/CommittedSliderInput.tsx',
} as const;

function readSource(path: string) {
  return readFileSync(path, 'utf8');
}

describe('single calculator localized accessibility contract', () => {
  it('localizes the assumption disclosure copy', () => {
    const source = readSource(sources.inputs);

    expect(source).toContain("t('bonds.form.step_inflation_title')");
    expect(source).toContain("t('bonds.form.step_inflation_desc')");
    expect(source).toContain("t('bonds.form.step_nbp_title')");
    expect(source).toContain("t('bonds.form.step_nbp_desc')");
    expect(source).not.toContain('title="3. Inflation setup"');
    expect(source).not.toContain('title="4. NBP rate setup"');
  });

  it('localizes assistive labels in shared and single-calculator controls', () => {
    expect(readSource(sources.formField)).toContain("t('common.more_information')");
    expect(readSource(sources.actionGrid)).toContain("t('bonds.results.actions_label')");
    expect(readSource(sources.summary)).toContain("t('bonds.results.show_calculation_details')");
  });

  it('gives numeric calculator controls stable names and disables password-manager autocomplete', () => {
    const config = readSource(sources.config);
    const moneyInput = readSource(sources.moneyInput);
    const sliderInput = readSource(sources.sliderInput);

    expect(config).toContain('name="savingsGoal"');
    expect(config).toContain('name="bondUnits"');
    expect(config).toContain('autoComplete="off"');
    expect(moneyInput).toContain('autoComplete="off"');
    expect(sliderInput).toContain('autoComplete="off"');
  });
});
