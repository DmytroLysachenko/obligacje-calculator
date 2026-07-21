import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

async function source(path: string) {
  return readFile(`${root}/${path}`, 'utf8');
}

describe('single calculator form submission contract', () => {
  it('uses an explicit form id instead of a page-wide Enter keyboard shortcut', async () => {
    const container = await source(
      'features/single-calculator/components/BondCalculatorContainer.tsx',
    );

    expect(container).toContain("const SINGLE_CALCULATOR_FORM_ID = 'single-calculator-inputs';");
    expect(container).toContain(
      'const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>)',
    );
    expect(container).toContain('event.preventDefault();');
    expect(container).not.toContain('const handleKeyDown');
    expect(container).not.toContain('onKeyDown={handleKeyDown}');
  });

  it('commits only from a valid, non-pending form submission', async () => {
    const container = await source(
      'features/single-calculator/components/BondCalculatorContainer.tsx',
    );

    expect(container).toContain('if (!isCalculating && blockingGuardrails.length === 0)');
    expect(container).toContain('calculate();');
    expect(container).toContain('onSubmit={handleFormSubmit}');
    expect(container).toContain('formId={SINGLE_CALCULATOR_FORM_ID}');
  });

  it('keeps input controls in a semantic form element', async () => {
    const form = await source('features/single-calculator/components/BondInputsForm.tsx');

    expect(form).toContain('formId?: string;');
    expect(form).toContain('onSubmit?: React.FormEventHandler<HTMLFormElement>;');
    expect(form).toContain('<form');
    expect(form).toContain('id={formId}');
    expect(form).toContain('onSubmit={onSubmit}');
    expect(form).toContain('</form>');
  });

  it('makes the fixed action submit the form when a form id is supplied', async () => {
    const action = await source('shared/components/feedback/RecalculateButton.tsx');

    expect(action).toContain('formId?: string;');
    expect(action).toContain("type={formId ? 'submit' : 'button'}");
    expect(action).toContain('form={formId}');
    expect(action).toContain('onClick={formId ? undefined : onClick}');
    expect(action).toContain('disabled={loading || disabled}');
  });

  it('preserves click behavior for consumers without an associated form', async () => {
    const action = await source('shared/components/feedback/RecalculateButton.tsx');

    expect(action).toContain('onClick: () => void;');
    expect(action).toContain('formId?: string;');
    expect(action).toContain('onClick={formId ? undefined : onClick}');
  });

  it('prevents duplicate submission while the calculation is pending', async () => {
    const container = await source(
      'features/single-calculator/components/BondCalculatorContainer.tsx',
    );
    const action = await source('shared/components/feedback/RecalculateButton.tsx');

    expect(container).toContain('!isCalculating');
    expect(action).toContain('disabled={loading || disabled}');
    expect(action).toContain("{t('common.calculating')}");
  });
});
