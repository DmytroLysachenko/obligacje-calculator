'use client';

import React from 'react';
import { Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { BondType } from '@/features/bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { MarketAssumptionsForm } from '@/shared/components/MarketAssumptionsForm';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';
import { ReadingChecklist } from '@/shared/components/insights/ReadingChecklist';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBondSupportMeta } from '@/features/bond-core/support-matrix';
import { SectionBlock } from '@/shared/components/page/SectionBlock';
import { FormInlineNotice } from '@/shared/components/forms/FormInlineNotice';

function StepCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-t border-border py-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--finance-success)]" />
        <div className="space-y-2">
          <p className="ui-metadata font-semibold text-muted-foreground">{title}</p>
          <p className="ui-body text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

type ComparisonConfigurationPanelProps = {
  initialInvestment: number;
  onInitialInvestmentChange: (value: number) => void;
  duration: number;
  onDurationChange: (value: number) => void;
  expectedInflation: number;
  expectedNbpRate: number;
  customInflation?: number[];
  customNbpRate?: number[];
  onUpdateAssumption: (key: string, value: unknown) => void;
  selectedBonds: BondType[];
  onToggleBond: (type: BondType) => void;
  showRealValue: boolean;
  onShowRealValueChange: (value: boolean) => void;
};

export function ComparisonConfigurationPanel({
  initialInvestment,
  onInitialInvestmentChange,
  duration,
  onDurationChange,
  expectedInflation,
  expectedNbpRate,
  customInflation,
  customNbpRate,
  onUpdateAssumption,
  selectedBonds,
  onToggleBond,
  showRealValue,
  onShowRealValueChange,
}: ComparisonConfigurationPanelProps) {
  const { t } = useAppI18n();

  const comparisonReadingGuide = [
    t('comparison.page.reading_guide.understand_assumptions'),
    t('comparison.page.reading_guide.compare_payout'),
    t('comparison.page.reading_guide.check_real_value'),
  ];

  return (
    <aside className="space-y-5 xl:sticky xl:top-8 xl:h-fit">
      <SectionBlock
        title={t('comparison.page.configuration_title')}
        description={t('comparison.page.configuration_description')}
        icon={<Scale className="h-5 w-5 text-primary" />}
        variant="divided"
        className="py-5"
        contentClassName="space-y-5"
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">
              {t('comparison.page.initial_investment')}
            </Label>
            <CommittedSliderInput
              value={initialInvestment}
              min={1000}
              max={100000}
              step={100}
              unit="PLN"
              onCommit={onInitialInvestmentChange}
            />
          </div>

          <div className="space-y-2 border-t border-border pt-5">
            <Label className="text-xs font-semibold text-muted-foreground">
              {t('comparison.page.investment_horizon')}
            </Label>
            <CommittedSliderInput
              value={duration}
              min={1}
              max={30}
              step={1}
              unit={t('common.years')}
              onCommit={onDurationChange}
            />
          </div>

          <div className="space-y-4 border-t border-border pt-5">
            <MarketAssumptionsForm
              expectedInflation={expectedInflation}
              expectedNbpRate={expectedNbpRate}
              customInflation={customInflation}
              customNbpRate={customNbpRate}
              bondType={
                selectedBonds.includes(BondType.ROR) || selectedBonds.includes(BondType.DOR)
                  ? BondType.ROR
                  : BondType.EDO
              }
              inflationHorizonYears={duration}
              onUpdate={(key, value) => onUpdateAssumption(String(key), value)}
              compact
            />
          </div>

          <div className="space-y-3 border-t border-border pt-5">
            <div className="flex items-center justify-between gap-4 border-l-2 border-border bg-muted/20 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t('bonds.inflation.adjusted')}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  {t('comparison.page.real_value_toggle_description')}
                </p>
              </div>
              <Switch checked={showRealValue} onCheckedChange={onShowRealValueChange} />
            </div>
            <FormInlineNotice
              title={t('comparison.page.rollover_title')}
              description={t('comparison.page.rollover_description')}
            />
          </div>
        </div>
      </SectionBlock>

      <SectionBlock
        title={t('comparison.page.bond_picker_title')}
        description={t('comparison.page.bond_picker_description')}
        variant="divided"
        className="py-5"
        contentClassName="space-y-5"
      >
        <div className="grid grid-cols-2 gap-2">
          {Object.values(BondType).map((type) => (
            <Button
              key={type}
              variant={selectedBonds.includes(type) ? 'default' : 'outline'}
              className={cn(
                'h-auto min-h-12 justify-start px-3 py-3 text-left',
                !selectedBonds.includes(type) && 'text-foreground',
              )}
              onClick={() => onToggleBond(type)}
            >
              <div className="flex flex-col items-start leading-tight">
                <span className="text-xs font-semibold uppercase tracking-wide">{type}</span>
                <span
                  className={cn(
                    'mt-1 text-[10px] font-medium normal-case opacity-80',
                    selectedBonds.includes(type)
                      ? 'text-primary-foreground/85'
                      : 'text-muted-foreground',
                  )}
                >
                  {getBondSupportMeta(type).shortLabel}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </SectionBlock>

      <SecondaryInsightAccordion
        title={t('comparison.page.how_to_read_title')}
        description={t('comparison.page.how_to_read_description')}
        badge={t('comparison.page.how_to_read_badge')}
      >
        <div className="space-y-4 text-sm leading-6 text-muted-foreground">
          <div className="border-l-2 border-warning bg-warning/5 px-4 py-4">
            <div className="flex items-center gap-2 font-semibold tracking-tight text-foreground">
              <AlertTriangle className="h-4 w-4 text-[var(--finance-warning)]" />
              {t('comparison.page.reading_checklist_title')}
            </div>
            <div className="mt-3">
              <ReadingChecklist items={comparisonReadingGuide} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <StepCard
              title={t('comparison.page.steps.configure_title')}
              description={t('comparison.page.steps.configure_description')}
            />
            <StepCard
              title={t('comparison.page.steps.run_title')}
              description={t('comparison.page.steps.run_description')}
            />
            <StepCard
              title={t('comparison.page.steps.decide_title')}
              description={t('comparison.page.steps.decide_description')}
            />
          </div>
        </div>
      </SecondaryInsightAccordion>
    </aside>
  );
}
