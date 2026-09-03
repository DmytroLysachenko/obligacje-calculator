import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { InflationChart } from '../components/InflationChart';
import { NBPRateChart } from '../components/NBPRateChart';

vi.mock('@/i18n/client', () => ({
  useAppI18n: () => ({ t: (key: string) => key, locale: 'en' }),
}));

vi.mock('@/shared/hooks/useChartData', () => ({
  useChartData: () => ({ data: undefined, isLoading: false, isError: true }),
}));

describe('economic chart failures', () => {
  it.each(['inflation', 'NBP'])('announces an unavailable %s reference series', (series) => {
    render(series === 'inflation' ? <InflationChart /> : <NBPRateChart />);

    expect(screen.getByRole('status').textContent).toContain('economic.failed_to_load');
  });
});
