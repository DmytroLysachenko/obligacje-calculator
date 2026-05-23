'use client';
import React from 'react';
import { ListTree, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { CalculationMetaPanel } from '@/shared/components/results/CalculationMetaPanel';
import { CalculatorPageShell } from '@/shared/components/page/CalculatorPageShell';
import { ReadingChecklist } from '@/shared/components/insights/ReadingChecklist';
import { RecalculateButton } from '@/shared/components/feedback/RecalculateButton';
import { SecondaryInsightAccordion } from '@/shared/components/results/SecondaryInsightAccordion';
import { RegularInvestmentInputsForm } from '../../regular-investment/components/RegularInvestmentInputsForm';
import { RegularInvestmentResultsSummary } from '../../regular-investment/components/RegularInvestmentResultsSummary';
import { useLadder } from '../hooks/useLadder';
import { LadderTimeline } from './LadderTimeline';
const LadderEmptyState = () => {
    const { t } = useAppI18n();
    return (<Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
      <CardContent className="space-y-5 p-6 md:p-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700">
            <TrendingUp className="h-3.5 w-3.5 text-primary"/>
            {t('bonds.simulation.ready')}
          </div>
          <h3 className="text-3xl font-black tracking-tight text-slate-950">
            {t('ladder_page.empty_state_title')}
          </h3>
          <p className="max-w-3xl text-sm leading-8 text-slate-600">
            {t('ladder_page.empty_state_description')}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-none">
            <CardContent className="space-y-2 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                {t('ladder_page.empty_cards.plan_title')}
              </p>
              <p className="text-sm leading-7 text-slate-600">
                {t('ladder_page.empty_cards.plan_description')}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-none">
            <CardContent className="space-y-2 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                {t('ladder_page.empty_cards.committed_title')}
              </p>
              <p className="text-sm leading-7 text-slate-600">
                {t('ladder_page.empty_cards.committed_description')}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-none">
            <CardContent className="space-y-2 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                {t('ladder_page.empty_cards.timing_title')}
              </p>
              <p className="text-sm leading-7 text-slate-600">
                {t('ladder_page.empty_cards.timing_description')}
              </p>
            </CardContent>
          </Card>
        </div>

        <p className="text-sm leading-7 text-slate-600">
          {t('ladder_page.empty_state_footer')}
        </p>
      </CardContent>
    </Card>);
};
const LadderLoadingState = () => (<div className="space-y-4">
    <Skeleton className="h-28 w-full rounded-[2rem]"/>
    <Skeleton className="h-48 w-full rounded-[2rem]"/>
    <Skeleton className="h-[460px] w-full rounded-[2rem]"/>
  </div>);
export const LadderContainer: React.FC = () => {
    const { inputs, results, updateInput, setBondType, isDirty, isCalculating, calculate, envelope, isPersistenceReady, } = useLadder();
    const { t } = useAppI18n();
    const readingGuide = [
        t('ladder_page.reading_guide.check_peak_month'),
        t('ladder_page.reading_guide.check_clustering'),
    ];
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && (isDirty || !results)) {
            calculate();
        }
    };
    return (<CalculatorPageShell title={t('nav.ladder')} description={t('ladder.what_is_desc')} icon={<ListTree className="h-8 w-8"/>} isCalculating={isCalculating} isDirty={isDirty} hasResults={isPersistenceReady && !!results} onKeyDown={handleKeyDown}>
      <div className="space-y-10">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[420px_minmax(0,1fr)] xl:items-start">
          <aside className="xl:sticky xl:top-28 xl:h-fit">
            <RegularInvestmentInputsForm inputs={inputs} onUpdate={updateInput as (key: string, value: unknown) => void} onBondTypeChange={setBondType}/>
          </aside>

          <section className="space-y-6">
            {!results && !isCalculating ? <LadderEmptyState /> : null}
            {isCalculating && !results ? <LadderLoadingState /> : null}

            {results ? (<div className={cn('space-y-6 transition-opacity duration-200', isCalculating && 'pointer-events-none opacity-50')}>
                {isDirty ? (<div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
                    {t('ladder_page.stale_results')}
                  </div>) : null}

                <RegularInvestmentResultsSummary results={results}/>
              </div>) : null}
          </section>
        </div>

        {results ? (<div className={cn('space-y-8 transition-opacity duration-200', isCalculating && 'pointer-events-none opacity-50')}>
            <SecondaryInsightAccordion title={t('ladder_page.how_to_read_title')} description={t('ladder_page.how_to_read_description')} badge={t('ladder_page.how_to_read_badge')}>
              <ReadingChecklist items={readingGuide}/>
            </SecondaryInsightAccordion>

            <LadderTimeline results={results}/>

            <SecondaryInsightAccordion title={t('bonds.simulation.calculation_context')} description={t('ladder_page.calculation_context_description')} badge={t('ladder_page.calculation_context_badge')}>
              <CalculationMetaPanel warnings={envelope?.warnings} assumptions={envelope?.assumptions} calculationNotes={envelope?.calculationNotes} dataQualityFlags={envelope?.dataQualityFlags} dataFreshness={envelope?.dataFreshness}/>
            </SecondaryInsightAccordion>
          </div>) : null}
      </div>

      <RecalculateButton isDirty={isDirty} hasResults={!!results} loading={isCalculating} onClick={() => calculate()}/>
    </CalculatorPageShell>);
};





