import { format, parseISO } from 'date-fns';
import { RegularInvestmentResult, ChartStep } from '@/features/bond-core/types';

export function aggregateRegularTimelinePoints(
  timeline: RegularInvestmentResult['timeline'],
  chartStep: ChartStep,
) {
  if (chartStep === 'daily' || chartStep === 'monthly') {
    return timeline;
  }

  const grouped = new Map<string, RegularInvestmentResult['timeline'][number]>();

  for (const point of timeline) {
    const date = parseISO(point.date);
    const year = date.getFullYear();
    const month = date.getMonth();
    const key =
      chartStep === 'quarterly'
        ? `${year}-Q${Math.floor(month / 3) + 1}`
        : `${year}`;

    grouped.set(key, point);
  }

  return Array.from(grouped.values());
}

export function buildRegularInvestmentChartPoints(
  timeline: RegularInvestmentResult['timeline'],
  chartStep: ChartStep,
  formatter: (date: Date) => string,
  view: 'nominal' | 'real',
) {
  return aggregateRegularTimelinePoints(timeline, chartStep).map((point) => ({
    date: formatter(parseISO(point.date)),
    invested: Number(point.totalInvested.toFixed(2)),
    value:
      view === 'nominal'
        ? Number(point.nominalValue.toFixed(2))
        : Number(point.realValue.toFixed(2)),
  }));
}
