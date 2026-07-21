import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
const root = process.cwd();
const read = (path: string) => readFile(`${root}/${path}`, 'utf8');
describe('chart data table contract', () => {
  it('provides a progressive disclosure after the visual chart', async () => {
    const source = await read('shared/components/charts/BondValueChart.tsx');
    expect(source).toContain("import { ChartDataTable } from './ChartDataTable';");
    expect(source).toContain('<ChartDataTable data={data} series={series} formatCurrency={formatCurrency} />');
  });
  it('uses a semantic table with a hidden caption', async () => {
    const source = await read('shared/components/charts/ChartDataTable.tsx');
    expect(source).toContain('<details'); expect(source).toContain('<summary'); expect(source).toContain('<table'); expect(source).toContain('<caption className="sr-only">');
  });
  it('keeps dates as row headers and series as column headers', async () => {
    const source = await read('shared/components/charts/ChartDataTable.tsx');
    expect(source).toContain('scope="col"'); expect(source).toContain('scope="row"'); expect(source).toContain('series.map');
  });
  it('formats numeric values with the supplied locale formatter', async () => {
    const source = await read('shared/components/charts/ChartDataTable.tsx');
    expect(source).toContain('formatCurrency: (value: number) => string;'); expect(source).toContain('formatCurrency(value)'); expect(source).toContain("'—'");
  });
  it('avoids rendering an empty data inspector', async () => {
    const source = await read('shared/components/charts/ChartDataTable.tsx');
    expect(source).toContain('if (!data.length || !series.length) return null;');
  });
  it('keeps table labels translated in both locales', async () => {
    const [en, pl] = await Promise.all([read('i18n/translations/en.json'), read('i18n/translations/pl.json')]);
    expect(en).toContain('chart_data_table'); expect(pl).toContain('chart_data_table');
  });
  it('keeps large data sets scrollable without forcing page overflow', async () => {
    const source = await read('shared/components/charts/ChartDataTable.tsx');
    expect(source).toContain('max-h-80 overflow-auto');
    expect(source).toContain('min-w-[34rem]');
    expect(source).toContain('sticky top-0');
  });
  it('does not make color the only series identifier', async () => {
    const source = await read('shared/components/charts/ChartDataTable.tsx');
    expect(source).toContain('{item.label}');
    expect(source).toContain('key={item.key}');
    expect(source).toContain('className="whitespace-nowrap px-3 py-2 tabular-nums"');
  });
  it('uses each point date as a stable rendered row identity', async () => {
    const source = await read('shared/components/charts/ChartDataTable.tsx');
    expect(source).toContain('key={point.dateKey ?? point.date}');
    expect(source).toContain('{point.label}');
    expect(source).toContain('point[item.key]');
  });
});
