'use client';
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps, } from 'recharts';
import { ValueType, NameType, } from 'recharts/types/component/DefaultTooltipContent';
import { RegularInvestmentResult } from '../../bond-core/types';
import { ChartStep } from '../../bond-core/types';
import { useAppI18n } from '@/i18n/client';
import { format } from 'date-fns';
import { ChartContainer } from '@/shared/components/charts/ChartContainer';
import { ChartLegendStrip } from '@/shared/components/charts/ChartLegendStrip';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrencyFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { getBondColor } from '@/shared/lib/charts/get-bond-color';
import { sampleSeriesPoints } from '@/shared/lib/chart-series';
import { buildRegularInvestmentChartPoints } from '@/shared/lib/regular-investment-display';
import { getDateFnsLocale } from '@/i18n/locale-utils';
interface RegularInvestmentChartProps {
    results: RegularInvestmentResult;
    bondType: string;
    chartStep?: ChartStep;
}
interface PayloadEntry {
    name: string;
    value: number;
    color: string;
    dataKey?: string | number;
}
interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
    active?: boolean;
    payload?: PayloadEntry[];
    label?: NameType;
    formatCurrency: (value: number) => string;
}
const CustomTooltip = ({ active, payload, label, formatCurrency }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (<div className="min-w-[200px] rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg">
        <p className="ui-metadata mb-3 border-b border-border pb-2 font-semibold text-foreground">{label}</p>
        <div className="space-y-2">
          {payload.map((entry, index) => (<div key={index} className="flex justify-between items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}/>
                {entry.name}:
              </span>
              <span className="font-mono font-semibold text-primary">{formatCurrency(Number(entry.value))}</span>
            </div>))}
        </div>
      </div>);
    }
    return null;
};
export const RegularInvestmentChart: React.FC<RegularInvestmentChartProps> = ({ results, bondType, chartStep = 'monthly' }) => {
    const { t, locale: language } = useAppI18n();
    const [view, setView] = React.useState<'nominal' | 'real'>('nominal');
    const dateLocale = getDateFnsLocale(language);
    const primaryColor = getBondColor(bondType);
    const currencyFormatter = useCurrencyFormatter(language, {
        style: 'currency',
        currency: 'PLN',
        maximumFractionDigits: 0,
    });
    const chartData = React.useMemo(() => sampleSeriesPoints(buildRegularInvestmentChartPoints(results.timeline, chartStep, (date) => format(date, 'MM.yy', { locale: dateLocale }), view), 180), [chartStep, dateLocale, results.timeline, view]);
    const formatCurrency = React.useMemo(() => (value: number) => currencyFormatter.format(value), [currencyFormatter]);
    const legendItems = React.useMemo(() => [
        {
            label: t('bonds.total_invested'),
            color: '#94a3b8',
            style: 'muted' as const,
        },
        {
            label: view === 'nominal' ? t('common.nominal_value') : t('common.real_value'),
            color: primaryColor,
        },
    ], [primaryColor, t, view]);
    return (<div className="space-y-6">
      <div className="flex justify-center">
        <Tabs value={view} onValueChange={(v) => setView(v as 'nominal' | 'real')} className="w-fit rounded-lg bg-muted/50 p-1">
          <TabsList className="grid w-full grid-cols-2 h-10">
            <TabsTrigger value="nominal" className="px-6 text-xs font-semibold">{t('common.nominal_value')}</TabsTrigger>
            <TabsTrigger value="real" className="px-6 text-xs font-semibold">{t('common.real_value')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ChartLegendStrip items={legendItems}/>

      <ChartContainer responsiveHeightClassName="h-[360px] md:h-[450px] xl:h-[500px]">
        <ResponsiveContainer width="100%" height="100%" key={`chart-${chartData.length}-${view}`}>
          <AreaChart data={chartData} margin={{ top: 12, right: 30, left: 40, bottom: 20 }}>
            <defs>
              <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.15}/>
                <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)"/>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }} tickLine={false} axisLine={false} dy={10}/>
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }} tickLine={false} axisLine={false} tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`}/>
            <Tooltip content={<CustomTooltip formatCurrency={formatCurrency}/>}/>
            <Area type="monotone" dataKey="invested" name={t('bonds.total_invested')} stroke="#94a3b8" strokeWidth={3} fillOpacity={1} fill="url(#colorInvested)" animationDuration={1500}/>
            <Area type="monotone" dataKey="value" name={view === 'nominal' ? t('common.nominal_value') : t('common.real_value')} stroke={primaryColor} strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" animationDuration={1500}/>
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>);
};




