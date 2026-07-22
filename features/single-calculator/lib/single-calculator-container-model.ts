import type { BondInputs, CalculationResult } from '@/features/bond-core/types';

type TranslateFn = (key: string) => string;

export function buildSingleCalculatorReadingGuide(t: TranslateFn) {
  return [
    t('bonds.simulation.reading_guide.summary_first'),
    t('bonds.simulation.reading_guide.chart_then_timeline'),
    t('bonds.simulation.reading_guide.stale_until_recalculated'),
  ];
}

export function buildSavedSingleScenarioMeta(
  inputs: BondInputs,
  results: CalculationResult | null,
) {
  const horizonMonths = inputs.investmentHorizonMonths ?? Math.round(inputs.duration * 12);

  return {
    name: `Single ${inputs.bondType} ${horizonMonths}M`,
    description: `Net payout ${results ? results.netPayoutValue.toFixed(2) : 'pending'} PLN`,
  };
}

export function buildSingleReportFilename(
  inputs: BondInputs,
  language: 'pl' | 'en',
  now = new Date(),
) {
  return `bond_report_${language}_${inputs.bondType}_${now.toISOString().split('T')[0]}.pdf`;
}
