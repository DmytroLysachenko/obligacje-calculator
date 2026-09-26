import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CalculatorWorkspace } from './CalculatorWorkspace';

vi.mock('@/i18n/client', () => ({
  useAppI18n: () => ({ t: (key: string) => key, locale: 'en' }),
}));

describe('calculator workspace focus transitions', () => {
  it('restores focus when a committed result replaces the controls', () => {
    const props = {
      controls: <input aria-label="Investment" />,
      results: <p>Value</p>,
      scenarioSummary: [{ label: 'Bond', value: 'EDO' }],
    };
    const view = render(<CalculatorWorkspace {...props} />);
    screen.getByRole('textbox', { name: 'Investment' }).focus();
    view.rerender(<CalculatorWorkspace {...props} hasResults />);
    expect(screen.getByRole('button', { name: 'common.edit_plan' })).toBe(document.activeElement);
    fireEvent.click(screen.getByRole('button', { name: 'common.edit_plan' }));
    expect(screen.getByRole('textbox', { name: 'Investment' })).toBe(document.activeElement);
    fireEvent.click(screen.getByRole('button', { name: 'common.close_plan' }));
    expect(screen.getByRole('button', { name: 'common.edit_plan' })).toBe(document.activeElement);
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });
});
