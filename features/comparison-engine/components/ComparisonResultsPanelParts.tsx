import { InterestPayout } from '@/features/bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';

import { ComparisonResultsPanelProps } from '../types/comparison-results-panel';

type ComparisonChartHelpSectionProps = Pick<
  ComparisonResultsPanelProps,
  'inputsA' | 'inputsB' | 'usesMixedTimelineCadence'
>;

export function ComparisonChartHelpSection({
  inputsA,
  inputsB,
  usesMixedTimelineCadence,
}: ComparisonChartHelpSectionProps) {
  const { t } = useAppI18n();

  return (
    <SecondaryInsightAccordion
      title={t('comparison.comparison_chart_help_title')}
      description={t('comparison.comparison_chart_help_desc')}
      badge={usesMixedTimelineCadence ? t('comparison.mixed_cadence') : undefined}
      className="mt-0"
    >
      <div className="space-y-4 text-sm leading-7 text-muted-foreground">
        <div className="border-t border-border py-4">
          <p>{t('comparison.comparison_chart_help_note')}</p>
        </div>
        {usesMixedTimelineCadence ? (
          <div className="ui-inline-notice border-l-2 border-warning text-warning">
            <p className="font-semibold">
              {t('comparison.mixed_cadence_notice', {
                bondTypeA: inputsA.bondType,
                cadenceA:
                  inputsA.payoutFrequency === InterestPayout.MONTHLY
                    ? t('comparison.cadence_monthly')
                    : t('comparison.cadence_longer'),
                bondTypeB: inputsB.bondType,
                cadenceB:
                  inputsB.payoutFrequency === InterestPayout.MONTHLY
                    ? t('comparison.cadence_monthly')
                    : t('comparison.cadence_longer'),
              })}
            </p>
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border-t border-border py-4">
            <p className="ui-card-title">{t('comparison.end_level')}</p>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">
              {t('comparison.end_level_desc')}
            </p>
          </div>
          <div className="border-t border-border py-4">
            <p className="ui-card-title">{t('comparison.update_rhythm')}</p>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">
              {t('comparison.update_rhythm_desc')}
            </p>
          </div>
        </div>
      </div>
    </SecondaryInsightAccordion>
  );
}
