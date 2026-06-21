import { describe, expect, it } from 'vitest';
import {
  buildFlatProjectedPath,
  formatCompactPercent,
  formatPathAverage,
  getHeaderAssumptionValue,
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
    expect(resolveAssumptionModeUpdate({
      mode: 'advanced',
      horizonLength: 2,
      currentValue: 4,
      fixedFallback: 2.5,
    })).toEqual({ nextMode: 'advanced', customPath: [4, 4] });
    expect(resolveAssumptionModeUpdate({
      mode: 'fixed',
      horizonLength: 2,
      currentValue: 4,
      fixedFallback: 2.5,
    })).toEqual({ nextMode: 'fixed', fixedValue: 2.5 });
    expect(resolveAssumptionModeUpdate({
      mode: 'simple',
      horizonLength: 2,
      currentValue: 4,
      fixedFallback: 2.5,
    })).toEqual({ nextMode: 'simple' });
  });

  it('uses path average only in advanced mode header values', () => {
    expect(getHeaderAssumptionValue({ mode: 'advanced', customPath: [3, 5], fallback: 2 })).toBe('Avg 4%');
    expect(getHeaderAssumptionValue({ mode: 'fixed', customPath: [3, 5], fallback: 2 })).toBe(2);
  });
});
