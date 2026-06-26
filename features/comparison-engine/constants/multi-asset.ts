import { AssetMetadata } from '@/features/bond-core/types/assets';

export const ASSETS_METADATA: Record<string, AssetMetadata> = {
  sp500: {
    id: 'sp500',
    name: 'S&P 500',
    color: '#2563eb',
    description: {
      en: 'US equities benchmark with high growth and high volatility.',
      pl: 'Benchmark akcji z USA o wysokim wzroscie i wysokiej zmiennosci.',
    },
  },
  gold: {
    id: 'gold',
    name: 'Gold',
    color: '#db2777',
    description: {
      en: 'Gold priced through historical market data.',
      pl: 'Zloto liczone na podstawie danych historycznych.',
    },
  },
  bonds: {
    id: 'bonds',
    name: 'EDO bonds',
    color: '#d97706',
    description: {
      en: 'Ten-year inflation-indexed treasury bond scenario.',
      pl: 'Scenariusz dla dziesiecioletnich obligacji EDO.',
    },
  },
  savings: {
    id: 'savings',
    name: 'Savings account',
    color: '#64748b',
    description: {
      en: 'Savings account scenario linked to historical NBP rates.',
      pl: 'Scenariusz konta oszczednosciowego powiazanego ze stopami NBP.',
    },
  },
};
