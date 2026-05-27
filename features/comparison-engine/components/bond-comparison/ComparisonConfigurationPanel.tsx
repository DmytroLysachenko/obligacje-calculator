'use client';

import React from 'react';
import { Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

function StepCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            {title}
          </p>
          <p className="text-sm leading-7 text-slate-600">{description}</p>
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
    <aside className="space-y-6 xl:sticky xl:top-24 xl:h-fit">
      <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
        <CardHeader className="space-y-3 border-b border-slate-200 pb-5">
          <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-950">
            <Scale className="h-5 w-5 text-primary" />
            {t('comparison.page.configuration_title')}
          </CardTitle>
          <CardDescription className="text-sm leading-7 text-slate-600">
            {t('comparison.page.configuration_description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-5 md:p-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
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

          <div className="space-y-2 border-t border-dashed border-slate-200 pt-5">
            <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
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

          <div className="space-y-4 border-t border-dashed border-slate-200 pt-5">
            <MarketAssumptionsForm
            expectedInflation={expectedInflation}
            expectedNbpRate={expectedNbpRate}
            customInflation={customInflation}
            customNbpRate={customNbpRate}
            bondType={
                selectedBonds.includes(BondType.ROR) ||
                selectedBonds.includes(BondType.DOR)
                  ? BondType.ROR
                  : BondType.EDO
              }
              inflationHorizonYears={duration}
              onUpdate={(key, value) =>
                onUpdateAssumption(String(key), value)
              }
              compact
            />
          </div>

          <div className="space-y-3 border-t border-dashed border-slate-200 pt-5">
            <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {t('bonds.inflation.adjusted')}
                </p>
                <p className="text-xs leading-6 text-slate-600">
                  {t('comparison.page.real_value_toggle_description')}
                </p>
              </div>
              <Switch
                checked={showRealValue}
                onCheckedChange={onShowRealValueChange}
              />
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-950">
                {t('comparison.page.rollover_title')}
              </p>
              <p className="mt-1 text-xs leading-6 text-slate-600">
                {t('comparison.page.rollover_description')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
        <CardHeader className="space-y-3 border-b border-slate-200 pb-5">
          <CardTitle className="text-lg font-black tracking-tight text-slate-950">
            {t('comparison.page.bond_picker_title')}
          </CardTitle>
          <CardDescription className="text-sm leading-7 text-slate-600">
            {t('comparison.page.bond_picker_description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 p-6">
          {Object.values(BondType).map((type) => (
            <Button
              key={type}
              variant={selectedBonds.includes(type) ? 'default' : 'outline'}
              className={cn(
                'h-auto min-h-14 justify-start rounded-2xl px-3 py-3 text-left',
                !selectedBonds.includes(type) && 'text-slate-700',
              )}
              onClick={() => onToggleBond(type)}
            >
              <div className="flex flex-col items-start leading-tight">
                <span className="text-xs font-black uppercase tracking-wide">
                  {type}
                </span>
                <span
                  className={cn(
                    'mt-1 text-[10px] font-medium normal-case opacity-80',
                    selectedBonds.includes(type)
                      ? 'text-primary-foreground/85'
                      : 'text-slate-500',
                  )}
                >
                  {getBondSupportMeta(type).shortLabel}
                </span>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      <SecondaryInsightAccordion
        title={t('comparison.page.how_to_read_title')}
        description={t('comparison.page.how_to_read_description')}
        badge={t('comparison.page.how_to_read_badge')}
      >
        <div className="space-y-4 text-sm leading-7 text-slate-600">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
            <div className="flex items-center gap-2 font-black tracking-tight text-slate-950">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
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
