import { BondType, InterestPayout } from '../types';

export interface BondDefinition {
  type: BondType;
  name: string;
  fullName: {
    en: string;
    pl: string;
  };
  description: {
    en: string;
    pl: string;
  };
  duration: number; // in years
  isCapitalized: boolean;
  payoutFrequency: InterestPayout;
  firstYearRate: number; // %
  margin: number; // %
  earlyWithdrawalFee: number; // PLN per bond
  isInflationIndexed: boolean;
  isFamilyOnly?: boolean;
}

export const BOND_DEFINITIONS: Record<BondType, BondDefinition> = {
  [BondType.OTS]: {
    type: BondType.OTS,
    name: 'OTS',
    fullName: {
      en: '3-Month Fixed Rate Savings Bonds',
      pl: 'Oszczędnościowe Trzymiesięczne Stałoprocentowe',
    },
    description: {
      en: 'Fixed interest rate for the entire 3-month period. Best for short-term savings.',
      pl: 'Stałe oprocentowanie przez cały okres 3 miesięcy. Idealne na krótkoterminowe oszczędności.',
    },
    duration: 0.25,
    isCapitalized: false,
    payoutFrequency: InterestPayout.MATURITY,
    firstYearRate: 3.00,
    margin: 0,
    earlyWithdrawalFee: 0,
    isInflationIndexed: false,
  },
  [BondType.ROR]: {
    type: BondType.ROR,
    name: 'ROR',
    fullName: {
      en: '1-Year Variable Rate Savings Bonds',
      pl: 'Roczne Oszczędnościowe Referencyjne',
    },
    description: {
      en: 'Interest rate tied to the NBP reference rate. Payouts are monthly.',
      pl: 'Oprocentowanie oparte na stopie referencyjnej NBP. Odsetki wypłacane co miesiąc.',
    },
    duration: 1,
    isCapitalized: false,
    payoutFrequency: InterestPayout.MONTHLY,
    firstYearRate: 5.75,
    margin: 0,
    earlyWithdrawalFee: 0.50,
    isInflationIndexed: false,
  },
  [BondType.DOR]: {
    type: BondType.DOR,
    name: 'DOR',
    fullName: {
      en: '2-Year Variable Rate Savings Bonds',
      pl: 'Dwuletnie Oszczędnościowe Referencyjne',
    },
    description: {
      en: 'Interest rate tied to the NBP reference rate plus a small margin. Monthly payouts.',
      pl: 'Oprocentowanie oparte na stopie referencyjnej NBP plus marża. Wypłata co miesiąc.',
    },
    duration: 2,
    isCapitalized: false,
    payoutFrequency: InterestPayout.MONTHLY,
    firstYearRate: 5.90,
    margin: 0.15,
    earlyWithdrawalFee: 0.70,
    isInflationIndexed: false,
  },
  [BondType.TOS]: {
    type: BondType.TOS,
    name: 'TOS',
    fullName: {
      en: '3-Year Fixed Rate Savings Bonds',
      pl: 'Trzyletnie Oszczędnościowe Stałoprocentowe',
    },
    description: {
      en: 'Fixed interest rate for 3 years with annual capitalization.',
      pl: 'Stałe oprocentowanie przez 3 lata z coroczną kapitalizacją odsetek.',
    },
    duration: 3,
    isCapitalized: true,
    payoutFrequency: InterestPayout.MATURITY,
    firstYearRate: 6.20,
    margin: 0,
    earlyWithdrawalFee: 1.00,
    isInflationIndexed: false,
  },
  [BondType.COI]: {
    type: BondType.COI,
    name: 'COI',
    fullName: {
      en: '4-Year Inflation-Indexed Savings Bonds',
      pl: 'Czteroletnie Oszczędnościowe Indeksowane',
    },
    description: {
      en: 'Interest rate tied to inflation after the first year. Annual interest payout.',
      pl: 'Oprocentowanie oparte na inflacji po pierwszym roku. Roczna wypłata odsetek.',
    },
    duration: 4,
    isCapitalized: false,
    payoutFrequency: InterestPayout.YEARLY,
    firstYearRate: 6.55,
    margin: 1.50,
    earlyWithdrawalFee: 2.00,
    isInflationIndexed: true,
  },
  [BondType.ROS]: {
    type: BondType.ROS,
    name: 'ROS',
    fullName: {
      en: '6-Year Family Inflation-Indexed Savings Bonds',
      pl: 'Rodzinne Oszczędnościowe Sześcioletnie',
    },
    description: {
      en: 'Dedicated to parents receiving 800+. Higher margin above inflation and annual capitalization.',
      pl: 'Dla beneficjentów programu 800+. Wyższa marża ponad inflację i coroczna kapitalizacja.',
    },
    duration: 6,
    isCapitalized: true,
    payoutFrequency: InterestPayout.MATURITY,
    firstYearRate: 6.75,
    margin: 2.00,
    earlyWithdrawalFee: 2.00,
    isInflationIndexed: true,
    isFamilyOnly: true,
  },
  [BondType.EDO]: {
    type: BondType.EDO,
    name: 'EDO',
    fullName: {
      en: '10-Year Inflation-Indexed Savings Bonds',
      pl: 'Emerytalne Dziesięcioletnie Oszczędnościowe',
    },
    description: {
      en: 'Long-term savings with inflation indexing and annual capitalization. High margin.',
      pl: 'Długoterminowe oszczędności indeksowane inflacją z coroczną kapitalizacją. Wysoka marża.',
    },
    duration: 10,
    isCapitalized: true,
    payoutFrequency: InterestPayout.MATURITY,
    firstYearRate: 6.80,
    margin: 2.00,
    earlyWithdrawalFee: 3.00,
    isInflationIndexed: true,
  },
  [BondType.ROD]: {
    type: BondType.ROD,
    name: 'ROD',
    fullName: {
      en: '12-Year Family Inflation-Indexed Savings Bonds',
      pl: 'Rodzinne Oszczędnościowe Dwunastoletnie',
    },
    description: {
      en: 'Longest term family bonds with highest margin and annual capitalization.',
      pl: 'Najdłuższe obligacje rodzinne z najwyższą marżą i coroczną kapitalizacją.',
    },
    duration: 12,
    isCapitalized: true,
    payoutFrequency: InterestPayout.MATURITY,
    firstYearRate: 7.05,
    margin: 2.50,
    earlyWithdrawalFee: 2.00,
    isInflationIndexed: true,
    isFamilyOnly: true,
  },
};
