import { describe, expect, it } from 'vitest';

import {
  buildFlatProjectedPath,
  formatCompactPercent,
  formatPathAverage,
  getHeaderAssumptionValue,
  getInflationPresetKey,
  getInflationPresetValue,
  getNbpPresetKey,
  getNbpPresetValue,
  resolveAssumptionModeUpdate,
} from './market-assumptions-form-model';

describe('market assumptions form model', () => {
  it('formats compact percentages without noisy trailing zeroes', () => {
    expect(formatCompactPercent(3)).toBe('3');
    expect(formatCompactPercent(3.2)).toBe('3.2');
    expect(formatCompactPercent(3.25)).toBe('3.25');
    expect(formatCompactPercent(Number.NaN)).toBe('0');
  });

  it('formats path averages with fallback for empty paths', () => {
    expect(formatPathAverage([3, 4, 5], 2.5)).toBe('Avg 4%');
    expect(formatPathAverage([], 2.5)).toBe('Avg 2.5%');
    expect(formatPathAverage(undefined, 3.25)).toBe('Avg 3.25%');
  });

  it('builds flat projected paths with at least one year', () => {
    expect(buildFlatProjectedPath(3, 3.75)).toEqual([3.75, 3.75, 3.75]);
    expect(buildFlatProjectedPath(0, 3.75)).toEqual([3.75]);
  });

  it('resolves mode transitions for fixed simple and advanced modes', () => {
    expect(
      resolveAssumptionModeUpdate({
        mode: 'advanced',
        horizonLength: 2,
        currentValue: 4,
        fixedFallback: 2.5,
      }),
    ).toEqual({ nextMode: 'advanced', customPath: [4, 4] });
    expect(
      resolveAssumptionModeUpdate({
        mode: 'fixed',
        horizonLength: 2,
        currentValue: 4,
        fixedFallback: 2.5,
      }),
    ).toEqual({ nextMode: 'fixed', fixedValue: 2.5 });
    expect(
      resolveAssumptionModeUpdate({
        mode: 'simple',
        horizonLength: 2,
        currentValue: 4,
        fixedFallback: 2.5,
      }),
    ).toEqual({ nextMode: 'simple' });
  });

  it('uses path average only in advanced mode header values', () => {
    expect(getHeaderAssumptionValue({ mode: 'advanced', customPath: [3, 5], fallback: 2 })).toBe(
      'Avg 4%',
    );
    expect(getHeaderAssumptionValue({ mode: 'fixed', customPath: [3, 5], fallback: 2 })).toBe(2);
  });

  it('keeps inflation preset keys and values centralized', () => {
    expect(getInflationPresetKey(2.5)).toBe('stable');
    expect(getInflationPresetKey(6)).toBe('high');
    expect(getInflationPresetKey(-1)).toBe('deflation');
    expect(getInflationPresetKey(4.2)).toBe('stable');

    expect(getInflationPresetValue('stable')).toBe(2.5);
    expect(getInflationPresetValue('high')).toBe(6);
    expect(getInflationPresetValue('deflation')).toBe(-1);
  });

  it('keeps NBP preset keys and values centralized', () => {
    expect(getNbpPresetKey(undefined)).toBe('current');
    expect(getNbpPresetKey(5.25)).toBe('current');
    expect(getNbpPresetKey(6.75)).toBe('high');
    expect(getNbpPresetKey(3.75)).toBe('low');
    expect(getNbpPresetKey(4.5)).toBe('current');

    expect(getNbpPresetValue('current')).toBe(5.25);
    expect(getNbpPresetValue('high')).toBe(6.75);
    expect(getNbpPresetValue('low')).toBe(3.75);
  });
});
