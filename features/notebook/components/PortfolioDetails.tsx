"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { UserPortfolio, UserInvestmentLot } from '@/db/schema';
import { useLanguage } from '@/i18n';
import {
  ArrowLeft,
  Trash2,
  Download,
  ExternalLink,
  FolderOpen,
  Loader2,
  Share2,
  ShieldCheck,
  TrendingUp,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { addDays, format, isAfter, parseISO } from 'date-fns';
import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';
import { BondType } from '@/features/bond-core/types';
import { cn } from '@/lib/utils';
import { formatBondDuration } from '@/shared/lib/format-bond-duration';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { ChartSupportNote } from '@/shared/components/charts/ChartSupportNote';
import { unwrapApiData } from '@/shared/lib/api-response';
import { downloadJsonFile } from '@/shared/lib/csv-utils';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PortfolioSimulationResult } from '@/features/bond-core/types/scenarios';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PortfolioDetailsProps {
  portfolio: UserPortfolio;
  onBack: () => void;
  onDelete?: (portfolio: UserPortfolio) => Promise<void> | void;
  onPortfolioUpdate?: (portfolio: UserPortfolio) => void;
}

type MaturityWindow = 30 | 90 | 180;

function PortfolioMiniStat({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/80 bg-white/78 px-4 py-4 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.35)] backdrop-blur">
      <p className="text-sm font-semibold text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-[13px] leading-6 text-slate-600">{description}</p>
    </div>
  );
}

export const PortfolioDetails: React.FC<PortfolioDetailsProps> = ({
  portfolio,
  onBack,
  onDelete,
  onPortfolioUpdate,
}) => {
  const { t, language } = useLanguage();
  const { definitions, isLoading: isLoadingDefs } = useBondDefinitions();
  const [lots, setLots] = useState<UserInvestmentLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [simulation, setSimulation] = useState<PortfolioSimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPublic, setIsPublic] = useState(portfolio.isPublic || false);
  const [isSharing, setIsSharing] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const [maturityWindowDays, setMaturityWindowDays] = useState<MaturityWindow>(90);

  const shareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/p/${portfolio.shareId}` : '';

  const formatCurrency = useCallback(
    (value: number) =>
      new Intl.NumberFormat(language === 'pl' ? 'pl-PL' : 'en-GB', {
        style: 'currency',
        currency: 'PLN',
        maximumFractionDigits: 0,
      }).format(value),
    [language],
  );

  const fetchLots = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/portfolio/lots?portfolioId=${portfolio.id}`);
      const data = await response.json();

      if (response.ok) {
        const nextLots = unwrapApiData<UserInvestmentLot[]>(data);
        setLots(Array.isArray(nextLots) ? nextLots : []);
      }
    } catch (caughtError) {
      console.error('Failed to fetch lots:', caughtError);
      setLots([]);
    } finally {
      setIsLoading(false);
    }
  }, [portfolio.id]);

  useEffect(() => {
    setIsPublic(portfolio.isPublic || false);
  }, [portfolio.id, portfolio.isPublic]);

  const runSimulation = useCallback(async () => {
    if (lots.length === 0) {
      setSimulation(null);
      return;
    }

    setIsSimulating(true);

    try {
      const response = await fetch('/api/portfolio/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioId: portfolio.id }),
      });

      const data = await response.json();
      if (response.ok) {
        setSimulation(unwrapApiData<PortfolioSimulationResult>(data) ?? null);
      }
    } catch (caughtError) {
      console.error('Simulation failed:', caughtError);
      setSimulation(null);
    } finally {
      setIsSimulating(false);
    }
  }, [lots.length, portfolio.id]);

  useEffect(() => {
    fetchLots();
  }, [fetchLots]);

  useEffect(() => {
    void runSimulation();
  }, [runSimulation]);

  const handleToggleShare = async () => {
    setIsSharing(true);

    try {
      const response = await fetch('/api/portfolio/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioId: portfolio.id, isPublic: !isPublic }),
      });

      if (response.ok) {
        const nextIsPublic = !isPublic;
        setIsPublic(nextIsPublic);
        onPortfolioUpdate?.({
          ...portfolio,
          isPublic: nextIsPublic,
          updatedAt: new Date(),
        });
      }
    } catch (caughtError) {
      console.error('Failed to update sharing:', caughtError);
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    } catch (caughtError) {
      console.error('Copy failed:', caughtError);
    }
  };

  const handleExport = async (formatName: 'portfolio' | 'package') => {
    try {
      const response = await fetch(
        `/api/portfolio/export?portfolioId=${portfolio.id}&format=${formatName}`,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error('Export failed');
      }
      const exportPayload = unwrapApiData<Record<string, unknown>>(data);
      const responseFilename =
        response.headers
          .get('content-disposition')
          ?.match(/filename="([^"]+)"/i)?.[1]
          ?? `${portfolio.name.replace(/\s+/g, '_').toLowerCase()}_${formatName}.json`;
      downloadJsonFile(exportPayload, responseFilename);
    } catch (caughtError) {
      console.error('Export failed:', caughtError);
    }
  };

  const totalValue = lots.reduce((sum, lot) => sum + Number(lot.amount) * 100, 0);

  const upcomingMaturities = useMemo(() => {
    if (!lots.length || !definitions) {
      return [];
    }

    return lots
      .map((lot) => {
        const definition = definitions[lot.bondType as BondType];
        if (!definition) {
          return null;
        }

        const maturityDate = addDays(parseISO(lot.purchaseDate), Math.round(definition.duration * 365));

        return {
          ...lot,
          maturityDate,
          value: Number(lot.amount) * 100,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null && isAfter(item.maturityDate, new Date()))
      .sort((left, right) => left.maturityDate.getTime() - right.maturityDate.getTime());
  }, [definitions, lots]);

  const filteredMaturities = useMemo(() => {
    const cutoff = addDays(new Date(), maturityWindowDays);
    return upcomingMaturities.filter((item) => item.maturityDate <= cutoff);
  }, [maturityWindowDays, upcomingMaturities]);

  const upcomingCashflow = filteredMaturities.reduce((sum, item) => sum + item.value, 0);
  const nextMaturity = upcomingMaturities[0] ?? null;
  const maturityWindowLabel =
    language === 'pl'
      ? `Najblizsze ${maturityWindowDays} dni`
      : `Next ${maturityWindowDays} days`;

  if (isLoadingDefs || !definitions) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-40 rounded bg-muted" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="h-32 rounded bg-muted" />
          <div className="h-32 rounded bg-muted" />
          <div className="h-32 rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <Card className="overflow-hidden rounded-[2.2rem] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(248,250,252,0.9))] shadow-[0_24px_70px_-52px_rgba(15,23,42,0.45)]">
        <CardContent className="space-y-6 p-6 lg:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border bg-white/80 px-3 py-1 text-xs font-semibold tracking-[0.08em] text-slate-700">
                <FolderOpen className="h-3.5 w-3.5 text-primary" />
                {t('notebook.record_view')}
              </div>
              <h3 className="text-2xl font-black tracking-tight text-slate-900">
                {t('notebook.record_intro_title')}
              </h3>
              <p className="text-sm leading-7 text-muted-foreground">
                {t('notebook.record_intro_desc')}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
              <PortfolioMiniStat
                label={t('notebook.stored_lots_label')}
                value={String(lots.length)}
                description={t('notebook.stored_lots_card_desc')}
              />
              <PortfolioMiniStat
                label={t('notebook.next_maturity_label')}
                value={nextMaturity ? format(nextMaturity.maturityDate, 'dd.MM.yyyy') : '-'}
                description={t('notebook.next_maturity_card_desc')}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <PortfolioMiniStat
              label={t('notebook.total_invested')}
              value={formatCurrency(totalValue)}
              description={
                language === 'pl'
                  ? 'Nominalna wartosc wszystkich zapisanych partii.'
                  : 'Nominal value across all stored lots.'
              }
            />
            <PortfolioMiniStat
              label={t('notebook.next_maturity')}
              value={nextMaturity ? nextMaturity.bondType : '-'}
              description={
                nextMaturity
                  ? `${format(nextMaturity.maturityDate, 'dd.MM.yyyy')} ${language === 'pl' ? 'najblizej' : 'comes next'}`
                  : language === 'pl'
                    ? 'Brak najblizszej zapadalnosci.'
                    : 'No upcoming maturity found.'
              }
            />
            <PortfolioMiniStat
              label={language === 'pl' ? 'Tryb udostepniania' : 'Sharing mode'}
              value={isPublic ? t('notebook.public') : t('notebook.private')}
              description={
                isPublic
                  ? language === 'pl'
                    ? 'Portfel ma aktywny publiczny link.'
                    : 'This portfolio currently has a public share link.'
                  : language === 'pl'
                    ? 'Portfel pozostaje prywatnym szkicem.'
                    : 'This portfolio is currently kept private.'
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 rounded-[1.8rem] border border-slate-200 bg-white/84 p-5 shadow-[0_18px_40px_-36px_rgba(15,23,42,0.35)] backdrop-blur md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-semibold text-foreground">{portfolio.name}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {portfolio.description || t('notebook.portfolio_details')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => handleExport('package')}>
            <Download className="h-4 w-4" />
            {t('notebook.export_package')}
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => handleExport('portfolio')}>
            <Download className="h-4 w-4" />
            {t('notebook.export_summary')}
          </Button>
          {onDelete ? (
            <Button
              variant="outline"
              className="gap-2 border-destructive/20 bg-background text-destructive hover:bg-destructive/5 hover:text-destructive"
              onClick={async () => {
                const confirmed = window.confirm(
                  language === 'pl'
                    ? `Usunac portfel "${portfolio.name}"? Tej operacji nie mozna cofnac.`
                    : `Delete portfolio "${portfolio.name}"? This action cannot be undone.`,
                );
                if (!confirmed) {
                  return;
                }
                await onDelete(portfolio);
                onBack();
              }}
            >
              <Trash2 className="h-4 w-4" />
              {language === 'pl' ? 'Usun portfel' : 'Delete portfolio'}
            </Button>
          ) : null}
          {isPublic && (
            <Button variant="outline" className="gap-2" onClick={copyToClipboard}>
              {justCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
              {justCopied ? t('common.copied') : t('common.copy_link')}
            </Button>
          )}
          <Button
            variant={isPublic ? 'default' : 'outline'}
            className={cn('gap-2', !isPublic && 'bg-background')}
            onClick={handleToggleShare}
            disabled={isSharing}
          >
            {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {isPublic ? t('notebook.public') : t('notebook.private')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="lots" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-2 md:w-fit">
          <TabsTrigger value="lots">{t('notebook.lots_tab')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('notebook.analytics_tab_short')}</TabsTrigger>
        </TabsList>

        <TabsContent value="lots" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.8fr]">
            <Card className="rounded-2xl border shadow-none">
              <CardHeader>
                <CardTitle>{t('notebook.stored_lots_title')}</CardTitle>
                <CardDescription>{t('notebook.stored_lots_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t('notebook.updating')}
                  </div>
                ) : lots.length === 0 ? (
                  <div className="rounded-2xl border border-dashed px-6 py-12 text-center">
                    <p className="text-sm text-muted-foreground">{t('notebook.no_lots')}</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                      <p>{t('notebook.stored_lots_hint')}</p>
                      <p className="text-sm font-semibold text-slate-500">
                        {t('notebook.lots_count', { count: String(lots.length) })}
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="h-12 text-sm font-semibold text-slate-600">{language === 'pl' ? 'Typ' : 'Type'}</TableHead>
                          <TableHead className="h-12 text-sm font-semibold text-slate-600">{language === 'pl' ? 'Okres' : 'Duration'}</TableHead>
                          <TableHead className="h-12 text-right text-sm font-semibold text-slate-600">{language === 'pl' ? 'Sztuki' : 'Amount'}</TableHead>
                          <TableHead className="h-12 text-sm font-semibold text-slate-600">{language === 'pl' ? 'Data zakupu' : 'Purchase date'}</TableHead>
                          <TableHead className="h-12 text-right text-sm font-semibold text-slate-600">{language === 'pl' ? 'Wartosc nominalna' : 'Nominal value'}</TableHead>
                          <TableHead className="h-12 text-right text-sm font-semibold text-slate-600">{language === 'pl' ? 'Akcja' : 'Action'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lots.map((lot) => (
                          <TableRow key={lot.id} className="odd:bg-slate-50/30 hover:bg-slate-50/80">
                            <TableCell className="py-4 font-medium">{lot.bondType}</TableCell>
                            <TableCell className="py-4 text-slate-600">
                              {formatBondDuration(
                                definitions[lot.bondType as BondType]?.duration ?? 1,
                                language,
                              )}
                            </TableCell>
                            <TableCell className="py-4 text-right">{lot.amount}</TableCell>
                            <TableCell className="py-4">{format(new Date(lot.purchaseDate), 'dd.MM.yyyy')}</TableCell>
                            <TableCell className="py-4 text-right">
                              {formatCurrency(Number(lot.amount) * 100)}
                            </TableCell>
                            <TableCell className="py-4 text-right">
                              <Button variant="outline" size="icon" asChild>
                                <a href={`/single-calculator?bondType=${lot.bondType}&purchaseDate=${lot.purchaseDate}`}>
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="rounded-2xl border shadow-none">
                <CardHeader>
                  <CardTitle>{t('notebook.liquidity_window_title')}</CardTitle>
                  <CardDescription>{t('notebook.liquidity_window_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {[30, 90, 180].map((days) => (
                      <Button
                        key={days}
                        variant={maturityWindowDays === days ? 'default' : 'outline'}
                        className="h-9"
                        onClick={() => setMaturityWindowDays(days as MaturityWindow)}
                      >
                        {days}d
                      </Button>
                    ))}
                  </div>

                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <p className="text-sm font-semibold text-muted-foreground">{t('notebook.cash_in_window')}</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {formatCurrency(upcomingCashflow)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{maturityWindowLabel}</p>
                  </div>

                  {filteredMaturities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('notebook.no_maturities_in_window')}</p>
                  ) : (
                    <div className="space-y-3">
                      {filteredMaturities.slice(0, 6).map((item) => (
                        <div key={item.id} className="rounded-2xl border p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">{item.bondType}</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {format(item.maturityDate, 'dd.MM.yyyy')}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                                {formatBondDuration(
                                  definitions[item.bondType as BondType]?.duration ?? 1,
                                  language,
                                )}
                              </p>
                            </div>
                            <p className="font-semibold text-foreground">{formatCurrency(item.value)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border shadow-none">
                <CardHeader>
                  <CardTitle>{t('notebook.usage_note_title')}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">{t('notebook.usage_note_desc')}</CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
            <Card className="rounded-2xl border shadow-none">
              <CardHeader>
                <CardTitle>{t('notebook.projection_title')}</CardTitle>
                <CardDescription>{t('notebook.projection_desc')}</CardDescription>
              </CardHeader>
            <CardContent className="space-y-4">
              <ChartSupportNote
                title={t('notebook.projection_read_title')}
                description={t('notebook.projection_read_desc')}
              />
              {isSimulating ? (
                <div className="flex min-h-[320px] items-center justify-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {language === 'pl'
                    ? 'Trwa symulacja portfela...'
                    : 'Running portfolio simulation...'}
                </div>
              ) : simulation?.aggregatedTimeline ? (
                <ChartContainer height={360}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={
                        simulation.aggregatedTimeline.length > 240
                          ? simulation.aggregatedTimeline.filter((_, index) => index % 2 === 0)
                          : simulation.aggregatedTimeline
                      }
                      margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="portfolioNet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.18} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => format(new Date(value), 'yyyy')}
                        minTickGap={48}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                      />
                      <Tooltip
                        labelFormatter={(value) => format(new Date(value as string), 'MMMM yyyy')}
                        formatter={(value: ValueType | undefined) => [
                          formatCurrency(Number(value ?? 0)),
                          language === 'pl' ? 'Wartosc laczna' : 'Total value',
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="totalNetValue"
                        stroke="#2563eb"
                        strokeWidth={3}
                        fill="url(#portfolioNet)"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">
                  {t('notebook.projection_empty')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="rounded-2xl border bg-muted/20 p-5">
        <div className="flex items-start gap-3">
          <TrendingUp className="mt-0.5 h-5 w-5 text-primary" />
          <div className="space-y-2">
            <p className="font-semibold text-foreground">{t('notebook.descriptive_title')}</p>
            <p className="text-sm leading-6 text-muted-foreground">{t('notebook.descriptive_desc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
