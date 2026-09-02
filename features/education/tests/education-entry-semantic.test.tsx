import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BOND_DEFINITIONS } from '@/features/bond-core/constants/bond-definitions';
import { BondType } from '@/features/bond-core/types';
import { BondEducationCard } from '@/features/education/components/BondEducationCard';
import { educationOfferGroups } from '@/features/education/constants/education-content';
import { OfferProvenance } from '@/shared/components/data/OfferProvenance';

vi.mock('@/i18n/client', () => ({
  useAppI18n: () => ({ t: (key: string) => key, locale: 'en' }),
}));

describe('education entry semantics', () => {
  it('renders each supported offer once with a calculator journey link', () => {
    const assigned = educationOfferGroups.flatMap((group) => group.bondTypes);
    expect(new Set(assigned)).toEqual(new Set(Object.values(BondType)));
    expect(assigned).toHaveLength(Object.values(BondType).length);

    render(
      <div>
        {assigned.map((bondType) => (
          <BondEducationCard key={bondType} bond={BOND_DEFINITIONS[bondType]} />
        ))}
      </div>,
    );

    const hrefs = screen
      .getAllByRole('link', { name: 'education.calculate_this_bond' })
      .map((link) => link.getAttribute('href'));
    expect(hrefs).toEqual(assigned.map((bondType) => `/single-calculator?bond=${bondType}`));
  });

  it('discloses the official offer source and warns when offer data is degraded', () => {
    render(
      <OfferProvenance
        dataFreshness={{
          status: 'fallback',
          usedFallback: true,
          bondOfferSource: 'curated-fallback',
          bondOfferStatus: 'partial',
        }}
      />,
    );

    expect(screen.getByText('landing.offer_provenance.label:', { exact: false })).toBeTruthy();
    expect(screen.getByText('Fallback dataset')).toBeTruthy();
    expect(screen.getByText('sidebar.freshness.offer_degraded_warning')).toBeTruthy();
  });
});
