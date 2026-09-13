import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BOND_DEFINITIONS } from '@/features/bond-core/constants/bond-definitions';
import { BondType } from '@/features/bond-core/types';

import { PortfolioLotsTableSection } from './PortfolioLotsTabSections';

describe('PortfolioLotsTableSection', () => {
  it('renders each stored holding as a readable mobile card as well as a desktop row', () => {
    render(
      <PortfolioLotsTableSection
        isLoading={false}
        lots={[
          {
            id: 'lot-1',
            portfolioId: 'portfolio-1',
            bondType: BondType.EDO,
            bondTypeId: null,
            bondSeriesId: null,
            purchaseDate: '2026-01-01',
            bondQuantity: '12',
            isRebought: false,
            notes: null,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
          },
        ]}
        definitions={BOND_DEFINITIONS}
        language="en"
        formatCurrency={(value) => `${value} PLN`}
        t={(key) => key}
      />,
    );

    expect(screen.getAllByText('EDO')).toHaveLength(2);
    expect(screen.getAllByText('1200 PLN')).toHaveLength(2);
    expect(screen.getAllByLabelText('notebook.open_lot_calculator')).toHaveLength(2);
    expect(screen.getAllByText('1 January 2026')).toHaveLength(2);
  });
});
