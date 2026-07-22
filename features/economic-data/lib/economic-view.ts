import type { PeriodValue } from './economic-dashboard-model';

export type EconomicSeriesKey = 'cpi' | 'nbp';
export type InflationScaleMode = 'readable' | 'full';

export interface EconomicView {
  series: EconomicSeriesKey;
  range: PeriodValue;
  scale: InflationScaleMode;
}

export const DEFAULT_ECONOMIC_VIEW: EconomicView = {
  series: 'cpi',
  range: '10Y',
  scale: 'readable',
};

const ranges = new Set<PeriodValue>(['1Y', '5Y', '10Y', '30Y', 'ALL']);

export function parseEconomicView(params: URLSearchParams): EconomicView {
  const series = params.get('series');
  const range = params.get('range');
  const scale = params.get('scale');

  return {
    series: series === 'nbp' ? 'nbp' : 'cpi',
    range: range && ranges.has(range as PeriodValue) ? (range as PeriodValue) : '10Y',
    scale: scale === 'full' ? 'full' : 'readable',
  };
}

export function serializeEconomicView(view: EconomicView) {
  const params = new URLSearchParams();
  params.set('series', view.series);
  params.set('range', view.range);
  if (view.series === 'cpi') params.set('scale', view.scale);
  return params.toString();
}
