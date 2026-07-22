import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { BondType } from '@/features/bond-core/types';
import {
  educationDecisionRoutes,
  educationOfferGroups,
} from '@/features/education/constants/education-content';

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8').replace(/\r\n/g, '\n');
}

describe('education entry layout', () => {
  it('assigns every supported bond to one and only one offer group', () => {
    const assigned = educationOfferGroups.flatMap((group) => group.bondTypes);

    expect(assigned).toHaveLength(Object.values(BondType).length);
    expect(new Set(assigned)).toEqual(new Set(Object.values(BondType)));
  });

  it('keeps each decision route connected to a visible offer group', () => {
    const groupKeys = new Set(educationOfferGroups.map((group) => group.key));

    for (const route of educationDecisionRoutes) {
      expect(groupKeys.has(route.groupKey)).toBe(true);
      expect(route.bondTypes.length).toBeGreaterThan(0);
    }
  });

  it('keeps the page as a decision-to-calculator journey', () => {
    const source = read('features/education/components/EducationClient.tsx');
    const card = read('features/education/components/BondEducationCard.tsx');

    expect(source).toContain('<EducationDecisionRail />');
    expect(source).toContain('<EducationOfferComparison definitions={definitions} />');
    expect(source).toContain('id={`offers-${group.key}`}');
    expect(card).toContain('href={`/single-calculator?bond=${bond.type}`}');
    expect(source).not.toContain('shadow-xl');
    expect(source).not.toContain('bg-gradient');
  });

  it('keeps education translations in parity for the redesigned journey', () => {
    const en = read('i18n/translations/en.json');
    const pl = read('i18n/translations/pl.json');

    for (const source of [en, pl]) {
      for (const key of [
        'hero_title',
        'decision_title',
        'comparison',
        'fixed_rate',
        'reference_rate',
        'inflation_indexed',
        'short_term',
        'long_term',
      ]) {
        expect(source).toContain(`\"${key}\"`);
      }
    }
  });
});
