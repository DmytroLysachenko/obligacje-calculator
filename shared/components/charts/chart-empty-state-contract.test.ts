import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const root = process.cwd();








async function source(path: string) {
  return readFile(`${root}/${path}`, 'utf8');
}

describe('bond chart empty-state contract', () => {
  it('detects missing chart points before mounting the visualization', async () => {
    const plot = await source('shared/components/charts/BondValueChartPlot.tsx');
    expect(plot).toContain('const hasData = data.length > 0;');
    expect(plot).toContain('if (!hasData) {');
    expect(plot.indexOf('if (!hasData) {')).toBeLessThan(plot.indexOf('<ChartContainer'));
  });

  it('uses a concise, localized empty-state message', async () => {
    const plot = await source('shared/components/charts/BondValueChartPlot.tsx');
    expect(plot).toContain("t('bonds.simulation.chart_empty')");
    expect(plot).toContain('role="status"');
  });

  it('keeps both supported locales in parity', async () => {
    const [en, pl] = await Promise.all([
      source('i18n/translations/en.json'),
      source('i18n/translations/pl.json'),
    ]);
    expect(en).toContain('chart_empty');
    expect(pl).toContain('chart_empty');
  });

  it('reduces chart side margins for narrow viewports', async () => {
    const plot = await source('shared/components/charts/BondValueChartPlot.tsx');
    expect(plot).toContain('margin={{ top: 12, right: 44, left: 24, bottom: 20 }}');
    expect(plot).not.toContain('margin={{ top: 12, right: 52, left: 40, bottom: 20 }}');
  });

  it('prevents densely sampled labels from colliding', async () => {
    const plot = await source('shared/components/charts/BondValueChartPlot.tsx');
    expect(plot).toContain('minTickGap={42}');
    expect(plot).not.toContain('minTickGap={30}');
  });

  it('reserves less horizontal space for the optional context axis', async () => {
    const plot = await source('shared/components/charts/BondValueChartPlot.tsx');
    expect(plot).toContain('width={38}');
    expect(plot).not.toContain('width={44}');
  });

  it('keeps the visual chart accessible after the empty state is resolved', async () => {
    const plot = await source('shared/components/charts/BondValueChartPlot.tsx');
    expect(plot).toContain('ariaLabel={ariaLabel}');
    expect(plot).toContain('summary={<p>{summary}</p>}');
    expect(plot).toContain('<ResponsiveContainer width="100%" height="100%"');
  });

  it('does not introduce client-only state for a data-derived condition', async () => {
    const plot = await source('shared/components/charts/BondValueChartPlot.tsx');
    expect(plot).toContain('const hasData = data.length > 0;');
    expect(plot).not.toContain('useState(data.length');
    expect(plot).not.toContain('useEffect(() => setHasData');
  });

  it('keeps chart rendering deterministic for equivalent input arrays', async () => {
    const plot = await source('shared/components/charts/BondValueChartPlot.tsx');
    expect(plot).toContain('data.findIndex((point) => point.isProjected)');
    expect(plot).toContain('[data],');
    expect(plot).toContain('key={`chart-${data.length}`}');
  });

  it('uses the existing design tokens in the empty state', async () => {
    const plot = await source('shared/components/charts/BondValueChartPlot.tsx');
    expect(plot).toContain('border-dashed border-border');
    expect(plot).toContain('bg-muted/20');
    expect(plot).toContain('text-muted-foreground');
  });
});
