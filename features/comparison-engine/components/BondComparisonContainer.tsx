'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { addYears, compareAsc, format, parseISO } from 'date-fns';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { AlertTriangle, CheckCircle2, Loader2, Scale, TrendingUp, } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { BondType, TaxStrategy } from '@/features/bond-core/types';
import { getBondSupportMeta } from '@/features/bond-core/support-matrix';
import { BondComparisonCalculationEnvelope } from '@/features/bond-core/types/scenarios';
import { useLanguage } from '@/i18n';
import { cn } from '@/lib/utils';
import { CalculationMetaPanel } from '@/shared/components/CalculationMetaPanel';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';
import { MarketAssumptionsForm } from '@/shared/components/MarketAssumptionsForm';
import { ReadingChecklist } from '@/shared/components/ReadingChecklist';
import { RecalculateButton } from '@/shared/components/RecalculateButton';
import { SecondaryInsightAccordion } from '@/shared/components/SecondaryInsightAccordion';
import { ChartSupportNote } from '@/shared/components/charts/ChartSupportNote';
import { getBondColor } from '@/shared/constants/bond-colors';
import { sampleSeriesPoints } from '@/shared/lib/chart-series';
import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';
import { pickLanguageValue } from '@/i18n/locale-utils';

type ChartDataPoint = {
    date: string;
    year: number;
} & Partial<Record<BondType, number>>;
function formatPct(value: number) {
    return `${value.toFixed(1)}%`;
}
function StepCard({ title, description, }: {
    title: string;
    description: string;
}) {
    return (<div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary"/>
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            {title}
          </p>
          <p className="text-sm leading-7 text-slate-600">{description}</p>
        </div>
      </div>
    </div>);
}
function ResultMetric({ label, value, tone = 'text-slate-950', }: {
    label: string;
    value: string;
    tone?: string;
}) {
    return (<div className="rounded-3xl border border-slate-200 bg-white px-5 py-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className={cn('mt-2 text-2xl font-black', tone)}>{value}</p>
    </div>);
}
function SectionBlock({ title, description, children, }: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (<section className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-2xl font-black tracking-tight text-slate-950">
          {title}
        </h3>
        {description ? (<p className="max-w-3xl text-sm leading-7 text-slate-600">
            {description}
          </p>) : null}
      </div>
      {children}
    </section>);
}
export const BondComparisonContainer = () => {
    const { language, t } = useLanguage();
    const { definitions } = useBondDefinitions();
    const [initialInvestment, setInitialInvestment] = useState(10000);
    const [expectedInflation, setExpectedInflation] = useState(3.5);
    const [expectedNbpRate, setExpectedNbpRate] = useState(5.25);
    const [customInflation, setCustomInflation] = useState<number[] | undefined>(undefined);
    const [inflationScenario, setInflationScenario] = useState<'low' | 'base' | 'high'>('base');
    const [duration, setDuration] = useState(10);
    const [selectedBonds, setSelectedBonds] = useState<BondType[]>([
        BondType.EDO,
        BondType.COI,
        BondType.ROR,
    ]);
    const [envelope, setEnvelope] = useState<BondComparisonCalculationEnvelope | null>(null);
    const [loading, setLoading] = useState(false);
    const [showRealValue, setShowRealValue] = useState(false);
    const [isDirty, setIsDirty] = useState(true);
    useEffect(() => {
        if (!customInflation) {
            return;
        }
        const nextLength = Math.max(1, Math.round(duration));
        if (customInflation.length === nextLength) {
            return;
        }
        setCustomInflation(Array.from({ length: nextLength }, (_, index) => customInflation[index] ?? expectedInflation));
    }, [customInflation, duration, expectedInflation]);
    const results = useMemo(() => (Array.isArray(envelope?.result) ? envelope.result : []), [envelope]);
    const purchaseDate = new Date().toISOString().split('T')[0];
    const withdrawalDate = addYears(new Date(purchaseDate), duration)
        .toISOString()
        .split('T')[0];
    const calculateComparison = useCallback(async () => {
        if (selectedBonds.length === 0) {
            return;
        }
        setLoading(true);
        setIsDirty(false);
        try {
            const response = await fetch('/api/calculate/compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'normalized',
                    bondTypes: selectedBonds,
                    initialInvestment,
                    purchaseDate,
                    withdrawalDate,
                    expectedInflation,
                    expectedNbpRate,
                    customInflation,
                    inflationScenario,
                    taxStrategy: TaxStrategy.STANDARD,
                }),
            });
            const data = await response.json();
            const nextEnvelope = data?.data ?? data;
            setEnvelope(nextEnvelope);
        }
        catch (error) {
            console.error('Comparison failed:', error);
        }
        finally {
            setLoading(false);
        }
    }, [
        customInflation,
        expectedInflation,
        expectedNbpRate,
        inflationScenario,
        initialInvestment,
        purchaseDate,
        selectedBonds,
        withdrawalDate,
    ]);
    const onUpdateAssumption = (key: string, value: unknown) => {
        setIsDirty(true);
        if (key === 'expectedInflation')
            setExpectedInflation(value as number);
        if (key === 'expectedNbpRate')
            setExpectedNbpRate(value as number);
        if (key === 'customInflation') {
            const nextPath = value as number[] | undefined;
            setCustomInflation(nextPath
                ? Array.from({ length: Math.max(1, Math.round(duration)) }, (_, index) => nextPath[index] ?? expectedInflation)
                : undefined);
        }
        if (key === 'inflationScenario')
            setInflationScenario(value as 'low' | 'base' | 'high');
    };
    const toggleBond = (type: BondType) => {
        setIsDirty(true);
        setSelectedBonds((prev) => prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]);
    };
    const chartData = useMemo(() => {
        if (results.length === 0)
            return [];
        const allDates = Array.from(new Set(results.flatMap((result) => result.result.timeline.map((point) => point.cycleEndDate))))
            .map((date) => parseISO(date))
            .sort(compareAsc);
        const projected = allDates.map((date) => {
            const row: ChartDataPoint = {
                date: format(date, 'MMM yyyy'),
                year: date.getFullYear(),
            };
            results.forEach((result) => {
                let currentValue = result.result.initialInvestment;
                for (const point of result.result.timeline) {
                    if (compareAsc(parseISO(point.cycleEndDate), date) <= 0) {
                        currentValue = showRealValue ? point.realValue : point.totalValue;
                    }
                    else {
                        break;
                    }
                }
                row[result.type] = currentValue;
            });
            return row;
        });
        return sampleSeriesPoints(projected, 180);
    }, [results, showRealValue]);
    const formatCurrency = (value: number) => new Intl.NumberFormat(pickLanguageValue(language, {
        pl: 'pl-PL',
        en: 'en-GB'
    }), {
        style: 'currency',
        currency: 'PLN',
        maximumFractionDigits: 0,
    }).format(value);
    const bestResult = useMemo(() => {
        if (results.length === 0) {
            return null;
        }
        return results.reduce((best, current) => current.result.netPayoutValue > best.result.netPayoutValue ? current : best);
    }, [results]);
    const comparisonReadingGuide = [
        pickLanguageValue(language, {
            pl: 'To porownanie pokazuje kompromisy scenariusza, a nie uniwersalnie najlepsza obligacje.',
            en: 'This comparison shows scenario tradeoffs, not a universally best bond.'
        }),
        pickLanguageValue(language, {
            pl: 'Czytaj je jako test jednego ustawienia wspolnego, nie jako gotowa rekomendacje dla kazdego inwestora.',
            en: 'Read it as a test of one committed shared setup, not as finished advice for every investor.'
        }),
        pickLanguageValue(language, {
            pl: 'Najpierw odczytaj wynik glowny, potem karty obligacji, a meta dane otwieraj tylko gdy chcesz zweryfikowac zalozenia.',
            en: 'Read the main result first, then the bond cards, and open the meta context only when you need to verify assumptions.'
        }),
    ];
    return (<div className="space-y-6 pb-20 md:space-y-8">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)] xl:gap-8">
        <aside className="space-y-6 xl:sticky xl:top-24 xl:h-fit">
          <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
            <CardHeader className="space-y-3 border-b border-slate-200 pb-5">
              <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-950">
                <Scale className="h-5 w-5 text-primary"/>
                {pickLanguageValue(language, {
        pl: 'Wspolny scenariusz',
        en: 'Shared scenario'
    })}
              </CardTitle>
              <CardDescription className="text-sm leading-7 text-slate-600">
                {pickLanguageValue(language, {
            pl: 'Jedna kwota, jeden horyzont i jeden zestaw zalozen. To ma izolowac roznice konstrukcyjne pomiedzy obligacjami.',
            en: 'One amount, one horizon, and one assumption set. This keeps the comparison focused on bond structure differences.'
        })}
              </CardDescription>
            </CardHeader>
              <CardContent className="space-y-6 p-5 md:p-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {pickLanguageValue(language, {
        pl: 'Kwota poczatkowa',
        en: 'Initial sum'
    })}
                </Label>
                <CommittedSliderInput value={initialInvestment} min={1000} max={100000} step={100} unit="PLN" onCommit={(value) => {
            setInitialInvestment(value);
            setIsDirty(true);
        }}/>
              </div>

              <div className="space-y-2 border-t border-dashed border-slate-200 pt-5">
                <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {pickLanguageValue(language, {
        pl: 'Horyzont',
        en: 'Horizon'
    })}
                </Label>
                <CommittedSliderInput value={duration} min={1} max={30} step={1} unit={t('common.years')} onCommit={(value) => {
            setDuration(value);
            setIsDirty(true);
        }}/>
              </div>

              <div className="space-y-4 border-t border-dashed border-slate-200 pt-5">
                <MarketAssumptionsForm expectedInflation={expectedInflation} expectedNbpRate={expectedNbpRate} customInflation={customInflation} inflationScenario={inflationScenario} bondType={selectedBonds.includes(BondType.ROR) ||
            selectedBonds.includes(BondType.DOR)
            ? BondType.ROR
            : BondType.EDO} inflationHorizonYears={duration} onUpdate={(key, value) => onUpdateAssumption(String(key), value)} compact/>
              </div>

              <div className="space-y-3 border-t border-dashed border-slate-200 pt-5">
                <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {t('bonds.inflation.adjusted')}
                    </p>
                    <p className="text-xs leading-6 text-slate-600">
                      {pickLanguageValue(language, {
            pl: 'Przelacz wykres i odczyt na wartosci realne.',
            en: 'Switch the chart and reading into real-value mode.'
        })}
                    </p>
                  </div>
                  <Switch checked={showRealValue} onCheckedChange={setShowRealValue}/>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-950">
                    {pickLanguageValue(language, {
        pl: 'Rollover porownania',
        en: 'Comparison rollover'
    })}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-slate-600">
                    {pickLanguageValue(language, {
            pl: 'Rollover jest wyliczany automatycznie dla kazdej obligacji, jesli wspolny horyzont wykracza poza jej natywny termin.',
            en: 'Rollover is inferred automatically for each bond when the shared horizon outlasts its native term.'
        })}
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
            <CardHeader className="space-y-3 border-b border-slate-200 pb-5">
              <CardTitle className="text-lg font-black tracking-tight text-slate-950">
                {pickLanguageValue(language, {
        pl: 'Obligacje w tym przebiegu',
        en: 'Bonds in this run'
    })}
              </CardTitle>
              <CardDescription className="text-sm leading-7 text-slate-600">
                {pickLanguageValue(language, {
            pl: 'Wybierz tylko te obligacje, ktore chcesz rzeczywiscie zestawic w jednym scenariuszu.',
            en: 'Pick only the bonds you actually want to test inside the same shared scenario.'
        })}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 p-6">
              {Object.values(BondType).map((type) => (<Button key={type} variant={selectedBonds.includes(type) ? 'default' : 'outline'} className={cn('h-auto min-h-14 justify-start rounded-2xl px-3 py-3 text-left', !selectedBonds.includes(type) && 'text-slate-700')} onClick={() => toggleBond(type)}>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-xs font-black uppercase tracking-wide">{type}</span>
                    <span className={cn('mt-1 text-[10px] font-medium normal-case opacity-80', selectedBonds.includes(type)
                ? 'text-primary-foreground/85'
                : 'text-slate-500')}>
                      {getBondSupportMeta(type).shortLabel}
                    </span>
                  </div>
                </Button>))}
            </CardContent>
          </Card>

          <SecondaryInsightAccordion title={pickLanguageValue(language, {
        pl: 'Jak czytac to porownanie',
        en: 'How to read this comparison'
    })} description={pickLanguageValue(language, {
            pl: 'Ta strona pokazuje kompromisy jednego wspolnego scenariusza. Wskazowki interpretacyjne zostaja jawne, ale nie powinny zaslaniac glownego wyniku.',
            en: 'This page shows the tradeoffs of one shared scenario. Interpretation notes stay explicit, but they should not overshadow the main result.'
        })} badge={pickLanguageValue(language, {
        pl: 'Pomocnicze',
        en: 'Secondary'
    })}>
            <div className="space-y-4 text-sm leading-7 text-slate-600">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex items-center gap-2 font-black tracking-tight text-slate-950">
                  <AlertTriangle className="h-4 w-4 text-amber-600"/>
                  {pickLanguageValue(language, {
        pl: 'Uwaga interpretacyjna',
        en: 'Interpretation note'
    })}
                </div>
                <div className="mt-3">
                  <ReadingChecklist items={comparisonReadingGuide}/>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <StepCard title={pickLanguageValue(language, {
        pl: '1. Wynik glowny',
        en: '1. Start with outcome'
    })} description={pickLanguageValue(language, {
            pl: 'Najpierw sprawdz najlepsza wyplate netto albo wartosc realna.',
            en: 'Check the best net payout or real-value outcome first.'
        })}/>
                <StepCard title={pickLanguageValue(language, {
        pl: '2. Karty obligacji',
        en: '2. Read bond cards'
    })} description={pickLanguageValue(language, {
            pl: 'Potem porownaj zysk, CAGR realny i podatek dla tego samego horyzontu.',
            en: 'Then compare profit, real CAGR, and tax for the same horizon.'
        })}/>
                <StepCard title={pickLanguageValue(language, {
        pl: '3. Meta i zalozenia',
        en: '3. Meta and assumptions'
    })} description={pickLanguageValue(language, {
            pl: 'Na koncu zajrzyj do meta danych tylko wtedy, gdy chcesz sprawdzic zalozenia lub jakosc danych.',
            en: 'Only then open the meta context if you need to verify assumptions or data quality.'
        })}/>
              </div>
            </div>
          </SecondaryInsightAccordion>
        </aside>

        <div className="space-y-8">
          {!results.length && !loading ? (<Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
              <CardContent className="space-y-6 p-5 md:p-8">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700">
                    <TrendingUp className="h-3.5 w-3.5 text-primary"/>
                    {t('comparison.ready_to_compare')}
                  </div>
                  <h3 className="text-3xl font-black tracking-tight text-slate-950">
                    {pickLanguageValue(language, {
                pl: 'Jedno porownanie. Jeden wspolny scenariusz.',
                en: 'One comparison. One shared scenario.'
            })}
                  </h3>
                  <p className="max-w-3xl text-sm leading-8 text-slate-600">
                    {pickLanguageValue(language, {
                pl: 'Najpierw wybierz obligacje, potem ustaw horyzont i zalozenia, a na koncu uruchom jedno czyste porownanie.',
                en: 'Pick the bonds first, then commit the shared assumptions, then run one clean comparison.'
            })}
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <StepCard title={pickLanguageValue(language, {
            pl: 'Krok 1',
            en: 'Step 1'
        })} description={pickLanguageValue(language, {
            pl: 'Wybierz obligacje.',
            en: 'Select the bonds.'
        })}/>
                  <StepCard title={pickLanguageValue(language, {
            pl: 'Krok 2',
            en: 'Step 2'
        })} description={pickLanguageValue(language, {
            pl: 'Ustaw wspolne zalozenia.',
            en: 'Set the shared assumptions.'
        })}/>
                  <StepCard title={pickLanguageValue(language, {
            pl: 'Krok 3',
            en: 'Step 3'
        })} description={pickLanguageValue(language, {
            pl: 'Uruchom porownanie.',
            en: 'Run the comparison.'
        })}/>
                </div>

              </CardContent>
            </Card>) : null}

          {loading && !results.length ? (<div className="flex h-[420px] items-center justify-center rounded-[2rem] border border-slate-200 bg-white">
              <Loader2 className="h-10 w-10 animate-spin text-primary"/>
            </div>) : null}

          {results.length ? (<div className="space-y-10">
              {isDirty ? (<div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
                  {pickLanguageValue(language, {
                    pl: 'Dane zostaly zmienione. Poniższe wyniki nadal pokazuja poprzedni przebieg az do recznego przeliczenia.',
                    en: 'Inputs changed. The results below still show the previous run until you recalculate.'
                })}
                </div>) : null}

              <SectionBlock title={pickLanguageValue(language, {
            pl: 'Szybki odczyt',
            en: 'Quick read'
        })} description={pickLanguageValue(language, {
                pl: 'Najpierw sprawdz zwyciezce tego scenariusza i glowna roznice w wypłacie netto.',
                en: 'Start with the scenario winner and the main gap in net payout.'
            })}>
                <div className="grid gap-4 lg:grid-cols-3">
                  <ResultMetric label={pickLanguageValue(language, {
            pl: 'Najlepszy wynik',
            en: 'Best result'
        })} value={bestResult ? bestResult.type : '-'}/>
                  <ResultMetric label={showRealValue ? t('bonds.real_value_inflation') : t('bonds.net_payout')} value={bestResult
                ? formatCurrency(showRealValue
                    ? bestResult.result.finalRealValue
                    : bestResult.result.netPayoutValue)
                : '-'} tone="text-emerald-700"/>
                  <ResultMetric label={pickLanguageValue(language, {
            pl: 'Liczba obligacji',
            en: 'Bonds compared'
        })} value={String(results.length)}/>
                </div>
              </SectionBlock>

              <SectionBlock title={pickLanguageValue(language, {
            pl: 'Wyniki obligacji',
            en: 'Bond outcomes'
        })} description={pickLanguageValue(language, {
                pl: 'Kazda karta pokazuje wynik tej samej kwoty i tego samego horyzontu.',
                en: 'Each card shows the outcome for the same amount and the same horizon.'
            })}>
                <div className="grid gap-4 xl:grid-cols-2">
                  {results.map((result) => {
                const bondDefinition = definitions?.[result.type];
                return (<Card key={result.type} className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
                        <CardContent className="space-y-5 p-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: getBondColor(result.type) }}/>
                              <p className="text-xl font-black tracking-tight text-slate-950">
                                {result.type}
                              </p>
                            </div>
                            <p className="text-sm leading-7 text-slate-600">
                              {bondDefinition
                        ? pickLanguageValue(language, {
                            pl: bondDefinition.description.pl,
                            en: bondDefinition.description.en
                        }) : getBondSupportMeta(result.type).description}
                            </p>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <ResultMetric label={showRealValue ? t('bonds.real_value_inflation') : t('bonds.net_payout')} value={formatCurrency(showRealValue
                        ? result.result.finalRealValue
                        : result.result.netPayoutValue)} tone="text-primary"/>
                            <ResultMetric label={t('common.net_profit')} value={formatCurrency(result.result.totalProfit)} tone={result.result.totalProfit >= 0 ? 'text-emerald-700' : 'text-destructive'}/>
                            <ResultMetric label={t('bonds.real_cagr')} value={formatPct(result.result.realAnnualizedReturn)} tone="text-blue-700"/>
                            <ResultMetric label={t('bonds.tax')} value={formatCurrency(result.result.totalTax)} tone="text-orange-700"/>
                          </div>
                        </CardContent>
                      </Card>);
            })}
                </div>
              </SectionBlock>

              <SectionBlock title={pickLanguageValue(language, {
            pl: 'Przebieg w czasie',
            en: 'Path over time'
        })} description={pickLanguageValue(language, {
                pl: 'Wykres sluzy do sprawdzenia ksztaltu scenariusza, a nie do tworzenia rankingowej dramaturgii.',
                en: 'Use the chart to inspect the scenario path, not to manufacture winner drama.'
            })}>
                <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-none">
                  <CardContent className="p-4 md:p-6">
                    <ChartSupportNote title={pickLanguageValue(language, {
            pl: 'Jak czytac wykres',
            en: 'How to read the chart'
        })} description={pickLanguageValue(language, {
                pl: 'Najpierw sprawdz miesiac szczytowy i poziom koncowy. Dopiero potem porownuj ksztalt sciezek.',
                en: 'Check the peak month and final level first. Only then compare the path shapes.'
            })}/>

                    <ChartContainer height={420}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                          <XAxis dataKey="date" tick={{ fontSize: 12 }}/>
                          <YAxis tickFormatter={(value) => `${value / 1000}k`} tick={{ fontSize: 12 }}/>
                          <Tooltip formatter={(value: ValueType | undefined) => typeof value === 'number'
                ? formatCurrency(value)
                : value ?? '-'}/>
                          <Legend />
                          {selectedBonds.map((bondType) => (<Line key={bondType} type="monotone" dataKey={bondType} name={bondType} stroke={getBondColor(bondType)} strokeWidth={2.5} dot={false}/>))}
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </SectionBlock>

              <SecondaryInsightAccordion title={t('bonds.simulation.calculation_context')} description={pickLanguageValue(language, {
                pl: 'Zalozenia, ostrzezenia i meta dane zostaja jawne, ale sa materialem pomocniczym po odczytaniu glownego wyniku.',
                en: 'Assumptions, warnings, and data context stay explicit, but they are support material after the main result.'
            })} badge={pickLanguageValue(language, {
            pl: 'Drugorzedne',
            en: 'Secondary'
        })}>
                <CalculationMetaPanel warnings={envelope?.warnings} assumptions={envelope?.assumptions} calculationNotes={envelope?.calculationNotes} dataQualityFlags={envelope?.dataQualityFlags} dataFreshness={envelope?.dataFreshness}/>
              </SecondaryInsightAccordion>
            </div>) : null}
        </div>
      </div>
      <RecalculateButton isDirty={isDirty} hasResults={results.length > 0} loading={loading} disabled={selectedBonds.length === 0} onClick={calculateComparison}/>
    </div>);
};
