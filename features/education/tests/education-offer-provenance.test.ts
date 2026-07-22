import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { CalculationDataFreshness } from '@/features/bond-core/types/scenarios';
import { getBondOfferFreshnessState } from '@/shared/lib/data-freshness-display';

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

function freshness(overrides: Partial<CalculationDataFreshness> = {}): CalculationDataFreshness {
  return { status: 'fresh', usedFallback: false, ...overrides };
}

describe('education offer provenance', () => {
  it('keeps official fresh offer metadata calm and visible', () => {
    expect(
      getBondOfferFreshnessState(
        freshness({
          bondOfferSource: 'gov.pl',
          bondOfferStatus: 'success',
          bondOfferAttemptAt: '2026-07-19T10:30:00.000Z',
        }),
      ),
    ).toMatchObject({
      source: 'gov.pl',
      attemptLabel: '2026-07-19',
      isDegraded: false,
    });
  });

  it('marks degraded and unavailable offer metadata with the existing warning state', () => {
    expect(
      getBondOfferFreshnessState(
        freshness({ bondOfferSource: 'curated-fallback', bondOfferStatus: 'partial' }),
      ).isDegraded,
    ).toBe(true);
    expect(getBondOfferFreshnessState(undefined)).toMatchObject({
      source: undefined,
      attemptLabel: null,
      isDegraded: true,
    });
  });

  it('passes global freshness to the shared display before preserving the official-source link', () => {
    const page = read('app/education/page.tsx');
    const client = read('features/education/components/EducationClient.tsx');

    expect(page).toContain('await getGlobalDataFreshness()');
    expect(page).toContain('<EducationClient dataFreshness={dataFreshness} />');
    expect(client).toContain('<OfferProvenance dataFreshness={dataFreshness} />');
    expect(client.indexOf('<OfferProvenance')).toBeLessThan(
      client.indexOf('https://www.obligacjeskarbowe.pl/'),
    );
  });
});
