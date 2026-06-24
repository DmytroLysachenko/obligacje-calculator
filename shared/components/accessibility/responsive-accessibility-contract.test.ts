import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), 'utf8');
}

describe('responsive accessibility contract', () => {
  it('keeps a keyboard skip path into the main application content', () => {
    const layout = read('app/layout.tsx');

    expect(layout).toContain('href="#main-content"');
    expect(layout).toContain('id="main-content"');
    expect(layout).toContain('tabIndex={-1}');
    expect(layout).toContain("t('common.skip_to_content')");
  });

  it('gives sidebar navigation explicit localized names', () => {
    const sidebar = read('shared/components/chrome/Sidebar.tsx');

    expect(sidebar).toContain("aria-label={t('common.primary_navigation')}");
    expect(sidebar).toContain("aria-label={t('common.open_navigation')}");
    expect(sidebar).toContain("t('common.navigation_menu')");
  });

  it('keeps chart containers keyboard reachable when they expose summaries', () => {
    const chartContainer = read('shared/components/charts/ChartContainer.tsx');

    expect(chartContainer).toContain('ariaLabel?: string');
    expect(chartContainer).toContain('summary?: React.ReactNode');
    expect(chartContainer).toContain("role={ariaLabel ? 'img' : undefined}");
    expect(chartContainer).toContain('tabIndex={ariaLabel ? 0 : undefined}');
    expect(chartContainer).toContain('className="sr-only"');
  });

  it('requires major financial charts to provide accessible summaries', () => {
    const singleChart = read('features/single-calculator/components/BondChart.tsx');
    const regularChart = read('features/regular-investment/components/RegularInvestmentChart.tsx');
    const comparisonChart = read(
      'features/comparison-engine/components/MultiAssetComparisonChart.tsx',
    );

    expect(singleChart).toContain('ariaLabel={t("bonds.value_chart_label")}');
    expect(singleChart).toContain('chart_accessible_summary');
    expect(regularChart).toContain("ariaLabel={t('regular_investment_page.value_chart_label')}");
    expect(regularChart).toContain('regular_investment_page.chart_accessible_summary');
    expect(comparisonChart).toContain("ariaLabel={t('comparison.growth_chart_label')}");
    expect(comparisonChart).toContain("ariaLabel={t('comparison.drawdown_chart_label')}");
    expect(comparisonChart).toContain('drawdown_accessible_summary');
  });

  it('keeps mobile table sheets labelled and scrollable as regions', () => {
    const sheet = read('shared/components/results/ResponsiveTableSheet.tsx');

    expect(sheet).toContain('sheetLabel?: string');
    expect(sheet).toContain('aria-labelledby={titleId}');
    expect(sheet).toContain('aria-describedby={descriptionId}');
    expect(sheet).toContain('role="region"');
    expect(sheet).toContain('custom-scrollbar min-h-0 flex-1 overflow-y-auto');
  });

  it('provides reusable text overflow and focus guardrails for dense controls', () => {
    const globals = read('app/globals.css');
    const select = read('shared/components/forms/FormSelect.tsx');
    const actions = read('shared/components/results/ResultActionGrid.tsx');
    const toolCard = read('shared/components/page/ToolCard.tsx');

    expect(globals).toContain('.ui-safe-text');
    expect(globals).toContain('overflow-wrap: anywhere;');
    expect(globals).toContain('.ui-truncate-flex');
    expect(globals).toContain('.ui-focus-ring');
    expect(select).toContain('ui-focus-ring');
    expect(select).toContain('ui-truncate-flex');
    expect(actions).toContain('ui-focus-ring');
    expect(actions).toContain('ui-truncate-flex');
    expect(toolCard).toContain('ui-safe-text');
  });

  it('keeps new accessibility copy in both locales', () => {
    const en = JSON.parse(read('i18n/translations/en.json'));
    const pl = JSON.parse(read('i18n/translations/pl.json'));

    const requiredCommonKeys = [
      'skip_to_content',
      'primary_navigation',
      'open_navigation',
      'navigation_menu',
    ];

    for (const key of requiredCommonKeys) {
      expect(en.common[key]).toBeTypeOf('string');
      expect(pl.common[key]).toBeTypeOf('string');
    }

    expect(en.bonds.value_chart_label).toBeTypeOf('string');
    expect(pl.bonds.value_chart_label).toBeTypeOf('string');
    expect(en.comparison.drawdown_chart_label).toBeTypeOf('string');
    expect(pl.comparison.drawdown_chart_label).toBeTypeOf('string');
    expect(en.regular_investment_page.value_chart_label).toBeTypeOf('string');
    expect(pl.regular_investment_page.value_chart_label).toBeTypeOf('string');
  });
});
