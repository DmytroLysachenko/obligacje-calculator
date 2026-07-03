import type { BondValueChartPoint, BondValueChartTooltipGroup } from './BondValueChart';

export interface BondValueTooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
  dataKey?: string | number;
  payload: BondValueChartPoint;
}

interface BondValueTooltipContext {
  isProjected: boolean;
  inflation?: number;
  nbp?: number;
}

interface StandardBondValueTooltipModel extends BondValueTooltipContext {
  kind: 'standard';
  interestRate?: number;
  rateSource?: string;
  eventLabels: string[];
  metrics: BondValueTooltipPayloadEntry[];
}

interface ScenarioBondValueTooltipModel extends BondValueTooltipContext {
  kind: 'scenario-groups';
  groups: BondValueChartTooltipGroup[];
}

export type BondValueTooltipModel = StandardBondValueTooltipModel | ScenarioBondValueTooltipModel;

export function buildBondValueTooltipModel(
  data: BondValueChartPoint,
  payload: BondValueTooltipPayloadEntry[],
): BondValueTooltipModel {
  const context = {
    isProjected: Boolean(data.isProjected),
    inflation: data.inflation,
    nbp: data.nbp,
  };

  if (Array.isArray(data.scenarioGroups) && data.scenarioGroups.length > 0) {
    return {
      kind: 'scenario-groups',
      groups: data.scenarioGroups,
      ...context,
    };
  }

  return {
    kind: 'standard',
    interestRate: data.interestRate,
    rateSource: data.rateSource,
    eventLabels: data.eventLabels ?? [],
    metrics: filterTooltipMetrics(payload),
    ...context,
  };
}

export function filterTooltipMetrics(payload: BondValueTooltipPayloadEntry[]) {
  return payload.filter((entry) => !['inflation', 'nbp'].includes(String(entry.dataKey)));
}
