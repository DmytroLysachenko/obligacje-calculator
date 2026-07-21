import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const formPath = 'features/single-calculator/components/BondInputsForm.tsx';
const sectionPath = 'shared/components/market-assumptions/MarketAssumptionSections.tsx';
const semanticsPath = 'shared/lib/market-assumption-semantics.ts';

function read(path: string) {
  return readFileSync(path, 'utf8');
}

describe('relevant market assumptions contract', () => {
  it('keeps market-assumption relevance derived from the selected bond type', () => {
    const source = read(formPath);

    expect(source).toContain("from '@/shared/lib/market-assumption-semantics'");
    expect(source).toContain('isInflationIndexedBondType(inputs.bondType)');
    expect(source).toContain('isFloatingNbpBondType(inputs.bondType)');
    expect(source).toContain('const usesInflation');
    expect(source).toContain('const usesNbpRate');
  });

  it('renders inflation controls only for inflation-indexed bonds', () => {
    const source = read(formPath);
    const inflationTitle = source.indexOf("title={t('bonds.form.step_inflation_title')}");
    const inflationSection = source.slice(inflationTitle - 160, inflationTitle + 900);

    expect(inflationTitle).toBeGreaterThan(-1);
    expect(inflationSection).toContain('{usesInflation ? (');
    expect(inflationSection).toContain('<MarketAssumptionsForm');
    expect(inflationSection).toContain('section="inflation"');
    expect(inflationSection).toContain('inflationSetupMode={inflationSetupMode}');
  });

  it('renders NBP controls only for floating-rate bonds', () => {
    const source = read(formPath);
    const nbpTitle = source.indexOf("title={t('bonds.form.step_nbp_title')}");
    const nbpSection = source.slice(nbpTitle - 160, nbpTitle + 900);

    expect(nbpTitle).toBeGreaterThan(-1);
    expect(nbpSection).toContain('{usesNbpRate ? (');
    expect(nbpSection).toContain('<MarketAssumptionsForm');
    expect(nbpSection).toContain('section="nbp"');
    expect(nbpSection).toContain('nbpSetupMode={nbpSetupMode}');
  });

  it('retains the shared component support for relevant and non-relevant notes', () => {
    const source = read(sectionPath);

    expect(source).toContain('isInflationIndexedBond');
    expect(source).toContain('isNbpRelevant');
    expect(source).toContain("t('bonds.market_assumptions.non_indexed_note')");
    expect(source).toContain("t('bonds.market_assumptions.nbp_note')");
  });

  it('keeps the source-of-truth predicates centralized', () => {
    const source = read(semanticsPath);

    expect(source).toContain('export function isInflationIndexedBondType');
    expect(source).toContain('export function isFloatingNbpBondType');
    expect(source).not.toContain('BondInputsForm');
  });
});
