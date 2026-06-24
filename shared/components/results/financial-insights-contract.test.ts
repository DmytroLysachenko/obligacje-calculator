import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

const paths = {
  strip: 'shared/components/results/FinancialInsightStrip.tsx',
  single: 'features/single-calculator/components/BondResultsSummary.tsx',
  singleContainer: 'features/single-calculator/components/BondCalculatorContainer.tsx',
  regular: 'features/regular-investment/components/RegularInvestmentResultsSummary.tsx',
  regularContainer:
    'features/regular-investment/components/RegularInvestmentCalculatorContainer.tsx',
  ladderContainer: 'features/ladder-strategy/components/LadderContainer.tsx',
  en: 'i18n/translations/en.json',
  pl: 'i18n/translations/pl.json',
} as const;

function readSource(relativePath: string) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

function expectContains(source: string, fragment: string) {
  expect(source).toContain(fragment);
}

describe('financial insight contracts', () => {
  it('provides one shared result insight strip', () => {
    const source = readSource(paths.strip);

    expectContains(source, 'export interface FinancialInsightItem');
    expectContains(
      source,
      'export const FinancialInsightStrip = React.memo(function FinancialInsightStrip',
    );
    expectContains(source, 'space-y-5 border-t border-border py-5');
    expectContains(source, 'grid gap-3 md:grid-cols-3');
    expectContains(source, 'border-l-2 px-4 py-3 text-sm leading-6');
    expectContains(source, 'financial-number mt-1 text-lg font-semibold');
    expectContains(source, "default: 'border-border text-foreground'");
    expectContains(source, "success: 'border-success/50 text-foreground'");
    expectContains(source, "warning: 'border-warning/50 text-foreground'");
  });

  it('adds tax, real value, and data quality interpretation to single calculator results', () => {
    const source = readSource(paths.single);
    const container = readSource(paths.singleContainer);

    expectContains(
      source,
      "import { FinancialInsightStrip, FinancialInsightItem } from '@/shared/components/results/FinancialInsightStrip';",
    );
    expectContains(source, 'dataQualityFlags?: string[];');
    expectContains(
      source,
      'const financialInsightItems = React.useMemo<FinancialInsightItem[]>(() => {',
    );
    expectContains(source, 'const grossProfitBeforeDeductions = Math.max(');
    expectContains(
      source,
      'results.totalProfit + results.totalTax + results.totalEarlyWithdrawalFee,',
    );
    expectContains(
      source,
      'const realValueGap = Math.max(0, results.netPayoutValue - results.finalRealValue);',
    );
    expectContains(source, "t('financial_insights.tax_impact_label')");
    expectContains(source, "t('financial_insights.real_value_label')");
    expectContains(source, "t('financial_insights.data_quality_label')");
    expectContains(source, '<FinancialInsightStrip');
    expectContains(container, 'dataQualityFlags={envelope?.dataQualityFlags}');
  });

  it('adds the same interpretation layer to regular and ladder strategy results', () => {
    const regular = readSource(paths.regular);
    const regularContainer = readSource(paths.regularContainer);
    const ladderContainer = readSource(paths.ladderContainer);

    expectContains(regular, 'dataQualityFlags?: string[];');
    expectContains(
      regular,
      'const financialInsightItems = useMemo<FinancialInsightItem[]>(() => {',
    );
    expectContains(
      regular,
      'const grossProfit = Math.max(0, results.totalProfit + results.totalTax);',
    );
    expectContains(
      regular,
      'const realValueGap = Math.max(0, results.finalNominalValue - results.finalRealValue);',
    );
    expectContains(regular, '<FinancialInsightStrip');
    expectContains(regularContainer, 'dataQualityFlags={envelope?.dataQualityFlags}');
    expectContains(ladderContainer, 'dataQualityFlags={envelope?.dataQualityFlags}');
  });

  it('keeps financial insight copy available in both locales', () => {
    const en = readSource(paths.en);
    const pl = readSource(paths.pl);

    for (const source of [en, pl]) {
      expectContains(source, '"financial_insights"');
      expectContains(source, '"tax_impact_label"');
      expectContains(source, '"real_value_label"');
      expectContains(source, '"data_quality_label"');
      expectContains(source, '"data_quality_clean_description"');
    }
  });
});
