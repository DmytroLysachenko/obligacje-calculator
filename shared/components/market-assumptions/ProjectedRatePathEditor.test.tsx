import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProjectedRatePathEditor } from './ProjectedRatePathEditor';

describe('projected rate path fields', () => {
  it('associates unique visible labels and distinct accessible names', () => {
    render(
      <>
        <ProjectedRatePathEditor
          values={[3, 4]}
          prefix="Y"
          variableLabel="Inflation"
          min={-20}
          max={100}
          step={0.1}
          onChange={() => {}}
        />
        <ProjectedRatePathEditor
          values={[5, 6]}
          prefix="Y"
          variableLabel="NBP reference rate"
          min={-10}
          max={100}
          step={0.1}
          onChange={() => {}}
        />
      </>,
    );
    expect(screen.getByRole('spinbutton', { name: 'Inflation, Y1' }).id).not.toBe(
      screen.getByRole('spinbutton', { name: 'NBP reference rate, Y1' }).id,
    );
    expect(screen.getAllByText('Y1')).toHaveLength(2);
  });
});
