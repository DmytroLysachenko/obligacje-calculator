import { describe, expect, it } from 'vitest';
import {
  buildBondValueTooltipModel,
  filterTooltipMetrics,
  type BondValueTooltipPayloadEntry,
} from './bond-value-tooltip-model';

const basePayload: BondValueTooltipPayloadEntry[] = [
  {
    name: 'Nominal',
    value: 100,
    color: '#111',
    dataKey: 'nominal',
    payload: { label: 'Jun 2026', date: '2026-06-01' },
  },
  {
    name: 'Inflation',
    value: 3.8,
    color: '#c89',
    dataKey: 'inflation',
    payload: { label: 'Jun 2026', date: '2026-06-01' },
  },
];

describe('bond value tooltip model', () => {
  it('removes context-rate series from standard currency metrics', () => {
    expect(filterTooltipMetrics(basePayload).map((entry) => entry.dataKey)).toEqual(['nominal']);
  });

  it('builds standard tooltip context from chart point metadata', () => {
    const model = buildBondValueTooltipModel(
      {
        label: 'Jun 2026',
        date: '2026-06-01',
        isProjected: true,
        interestRate: 5.35,
        rateSource: 'First-year fixed rate',
        eventLabels: ['Purchase'],
        inflation: 3.8,
      },
      basePayload,
    );

    expect(model).toMatchObject({
      kind: 'standard',
      isProjected: true,
      interestRate: 5.35,
      rateSource: 'First-year fixed rate',
      eventLabels: ['Purchase'],
      inflation: 3.8,
    });
  });

  it('prefers scenario group tooltips when grouped scenario data exists', () => {
    const model = buildBondValueTooltipModel(
      {
        label: 'Jun 2026',
        date: '2026-06-01',
        scenarioGroups: [
          {
            id: 'a',
            title: 'Scenario A',
            color: '#e00',
            metrics: [],
          },
        ],
      },
      basePayload,
    );

    expect(model.kind).toBe('scenario-groups');
  });
});
