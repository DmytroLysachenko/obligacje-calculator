import { describe, expect, it, vi } from 'vitest';
import * as csvUtils from './csv-utils';
import {
  buildComparisonExportLabel,
  buildLotsCsvFilename,
  buildTimelineCsvFilename,
  exportLotsCsv,
  exportTimelineCsv,
} from './retained-exports';

describe('retained export helpers', () => {
  it('builds stable timeline csv filenames', () => {
    expect(buildTimelineCsvFilename('bond_simulation', 'ROR')).toMatch(
      /^bond_simulation_ROR_\d{4}-\d{2}-\d{2}\.csv$/,
    );
    expect(buildTimelineCsvFilename('bond_comparison', 'EDO')).toMatch(
      /^bond_comparison_EDO_\d{4}-\d{2}-\d{2}\.csv$/,
    );
  });

  it('builds stable recurring csv filename', () => {
    expect(buildLotsCsvFilename()).toMatch(/^regular_investment_\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('routes timeline exports through the shared csv downloader', () => {
    const downloadSpy = vi.spyOn(csvUtils, 'downloadFile').mockImplementation(() => undefined);

    exportTimelineCsv({
      timeline: [] as never[],
      headers: { period: 'Period' },
      language: 'en',
      fileName: 'bond_simulation_ROR_2026-05-17.csv',
    });

    expect(downloadSpy).toHaveBeenCalledOnce();
    expect(downloadSpy.mock.calls[0]?.[1]).toBe('bond_simulation_ROR_2026-05-17.csv');

    downloadSpy.mockRestore();
  });

  it('routes lot exports through the shared csv downloader', () => {
    const downloadSpy = vi.spyOn(csvUtils, 'downloadFile').mockImplementation(() => undefined);

    exportLotsCsv({
      lots: [] as never[],
      headers: { purchaseDate: 'Purchase' },
      language: 'pl',
      fileName: 'regular_investment_2026-05-17.csv',
    });

    expect(downloadSpy).toHaveBeenCalledOnce();
    expect(downloadSpy.mock.calls[0]?.[1]).toBe('regular_investment_2026-05-17.csv');

    downloadSpy.mockRestore();
  });

  it('builds explicit comparison export labels', () => {
    const t = (key: string) => key;

    expect(buildComparisonExportLabel(t, 'pl', 'ROR')).toBe('comparison.export CSV (ROR)');
    expect(buildComparisonExportLabel(t, 'en', 'EDO')).toBe('comparison.export CSV (EDO)');
  });
});
