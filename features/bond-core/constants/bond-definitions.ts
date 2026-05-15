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
  duration: number;
  nominalValue: number;
  isCapitalized: boolean;
  payoutFrequency: InterestPayout;
  firstYearRate: number;
  margin: number;
  earlyWithdrawalFee: number;
  isInflationIndexed: boolean;
  isFloating: boolean;
  isFamilyOnly?: boolean;
  rebuyDiscount: number;
}

export const BOND_DEFINITIONS: Record<BondType, BondDefinition> = {
  [BondType.OTS]: {
    type: BondType.OTS,
    name: 'OTS',
    fullName: {
      en: '3-Month Fixed Rate Savings Bonds',
      pl: 'Oszczednosciowe trzymiesieczne stalooprocentowe',
    },
    description: {
      en: 'Fixed interest rate for the full 3-month term. Best for short-term cash parking.',
      pl: 'Stale oprocentowanie przez pelne 3 miesiace. Najprostsza opcja dla krotkiego postoju gotowki.',
    },
    duration: 0.25,
    nominalValue: 100,
    isCapitalized: false,
    payoutFrequency: InterestPayout.MATURITY,
    firstYearRate: 2.0,
    margin: 0,
    earlyWithdrawalFee: 0,
    isInflationIndexed: false,
    isFloating: false,
    rebuyDiscount: 0,
  },
  [BondType.ROR]: {
    type: BondType.ROR,
    name: 'ROR',
    fullName: {
      en: '1-Year Variable Rate Savings Bonds',
      pl: 'Roczne oszczednosciowe referencyjne',
    },
    description: {
      en: 'Monthly payout bond linked to the NBP reference rate after the first monthly period.',
      pl: 'Obligacja z miesieczna wyplata odsetek, oparta na stopie referencyjnej NBP po pierwszym okresie.',
    },
    duration: 1,
    nominalValue: 100,
    isCapitalized: false,
    payoutFrequency: InterestPayout.MONTHLY,
    firstYearRate: 4.0,
    margin: 0,
    earlyWithdrawalFee: 0.5,
    isInflationIndexed: false,
    isFloating: true,
    rebuyDiscount: 0.1,
  },
  [BondType.DOR]: {
    type: BondType.DOR,
    name: 'DOR',
    fullName: {
      en: '2-Year Variable Rate Savings Bonds',
      pl: 'Dwuletnie oszczednosciowe referencyjne',
    },
    description: {
      en: 'Monthly payout bond linked to the NBP reference rate with a 0.15% margin after the first period.',
      pl: 'Obligacja z miesieczna wyplata odsetek, oparta na stopie referencyjnej NBP z marza 0,15 p.p. po pierwszym okresie.',
    },
    duration: 2,
    nominalValue: 100,
    isCapitalized: false,
    payoutFrequency: InterestPayout.MONTHLY,
    firstYearRate: 4.15,
    margin: 0.15,
    earlyWithdrawalFee: 0.7,
    isInflationIndexed: false,
    isFloating: true,
    rebuyDiscount: 0.1,
  },
  [BondType.TOS]: {
    type: BondType.TOS,
    name: 'TOS',
    fullName: {
      en: '3-Year Fixed Rate Savings Bonds',
      pl: 'Trzyletnie oszczednosciowe stalooprocentowe',
    },
    description: {
      en: 'Fixed 3-year rate with annual capitalization.',
      pl: 'Stale oprocentowanie przez 3 lata z roczna kapitalizacja odsetek.',
    },
    duration: 3,
    nominalValue: 100,
    isCapitalized: true,
    payoutFrequency: InterestPayout.MATURITY,
    firstYearRate: 4.4,
    margin: 0,
    earlyWithdrawalFee: 0.7,
    isInflationIndexed: false,
    isFloating: false,
    rebuyDiscount: 0.1,
  },
  [BondType.COI]: {
    type: BondType.COI,
    name: 'COI',
    fullName: {
      en: '4-Year Inflation-Indexed Savings Bonds',
      pl: 'Czteroletnie oszczednosciowe indeksowane',
    },
    description: {
      en: 'First year fixed, then yearly inflation plus a 1.50% margin, with annual interest payout.',
      pl: 'Pierwszy rok staly, potem inflacja roczna plus marza 1,50 p.p., z coroczna wyplata odsetek.',
    },
    duration: 4,
    nominalValue: 100,
    isCapitalized: false,
    payoutFrequency: InterestPayout.YEARLY,
    firstYearRate: 4.75,
    margin: 1.5,
    earlyWithdrawalFee: 0.7,
    isInflationIndexed: true,
    isFloating: false,
    rebuyDiscount: 0.1,
  },
  [BondType.ROS]: {
    type: BondType.ROS,
    name: 'ROS',
    fullName: {
      en: '6-Year Family Inflation-Indexed Savings Bonds',
      pl: 'Rodzinne oszczednosciowe szescioletnie',
    },
    description: {
      en: 'Family bond for 800+ beneficiaries with annual capitalization and inflation plus 2.00% margin after year one.',
      pl: 'Rodzinna obligacja dla beneficjentow 800+ z roczna kapitalizacja i oprocentowaniem inflacja + 2,00 p.p. po pierwszym roku.',
    },
    duration: 6,
    nominalValue: 100,
    isCapitalized: true,
    payoutFrequency: InterestPayout.MATURITY,
    firstYearRate: 5.0,
    margin: 2.0,
    earlyWithdrawalFee: 2.0,
    isInflationIndexed: true,
    isFloating: false,
    isFamilyOnly: true,
    rebuyDiscount: 0,
  },
  [BondType.EDO]: {
    type: BondType.EDO,
    name: 'EDO',
    fullName: {
      en: '10-Year Inflation-Indexed Savings Bonds',
      pl: 'Emerytalne dziesiecioletnie oszczednosciowe',
    },
    description: {
      en: 'First year fixed, then yearly inflation plus a 2.00% margin with annual capitalization.',
      pl: 'Pierwszy rok staly, potem inflacja roczna plus marza 2,00 p.p. z coroczna kapitalizacja odsetek.',
    },
    duration: 10,
    nominalValue: 100,
    isCapitalized: true,
    payoutFrequency: InterestPayout.MATURITY,
    firstYearRate: 5.35,
    margin: 2.0,
    earlyWithdrawalFee: 3.0,
    isInflationIndexed: true,
    isFloating: false,
    rebuyDiscount: 0.1,
  },
  [BondType.ROD]: {
    type: BondType.ROD,
    name: 'ROD',
    fullName: {
      en: '12-Year Family Inflation-Indexed Savings Bonds',
      pl: 'Rodzinne oszczednosciowe dwunastoletnie',
    },
    description: {
      en: 'Longest family bond, with annual capitalization and inflation plus a 2.50% margin after year one.',
      pl: 'Najdluzsza obligacja rodzinna z roczna kapitalizacja i oprocentowaniem inflacja + 2,50 p.p. po pierwszym roku.',
    },
    duration: 12,
    nominalValue: 100,
    isCapitalized: true,
    payoutFrequency: InterestPayout.MATURITY,
    firstYearRate: 5.6,
    margin: 2.5,
    earlyWithdrawalFee: 3.0,
    isInflationIndexed: true,
    isFloating: false,
    isFamilyOnly: true,
    rebuyDiscount: 0,
  },
};
