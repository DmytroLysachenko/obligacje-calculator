import { BondType } from './types';
import type { AppLanguage } from '@/shared/lib/bond-display';
import { translateMessage } from '@/i18n/translate';

export const ALL_BOND_TYPES: BondType[] = [
  BondType.OTS,
  BondType.ROR,
  BondType.DOR,
  BondType.TOS,
  BondType.COI,
  BondType.ROS,
  BondType.EDO,
  BondType.ROD,
];

export const FAMILY_BOND_TYPES: BondType[] = [BondType.ROS, BondType.ROD];

export const RETIREMENT_SUPPORTED_BOND_TYPES: BondType[] = [
  BondType.ROR,
  BondType.DOR,
  BondType.TOS,
  BondType.COI,
  BondType.EDO,
];

export type BondSupportTone = 'neutral' | 'caution' | 'limited';

export interface BondSupportMeta {
  shortLabel: string;
  tone: BondSupportTone;
  description: string;
  shortLabelKey?: string;
  descriptionKey?: string;
}

const DEFAULT_SUPPORT_META: BondSupportMeta = {
  shortLabel: 'Standard',
  tone: 'neutral',
  description: 'Standard retail treasury bond flow.',
  shortLabelKey: 'bonds.support.standard_label',
  descriptionKey: 'bonds.support.standard_description',
};

const SUPPORT_META: Partial<Record<BondType, BondSupportMeta>> = {
  [BondType.OTS]: {
    shortLabel: 'Short-term',
    tone: 'limited',
    description:
      'Very short duration. Fine for simple payout tests, weak fit for long-horizon withdrawal modeling.',
    shortLabelKey: 'bonds.support.short_term_label',
    descriptionKey: 'bonds.support.short_term_description',
  },
  [BondType.ROS]: {
    shortLabel: 'Family-only',
    tone: 'caution',
    description:
      'Family-targeted bond. Only use when household eligibility assumptions actually apply.',
    shortLabelKey: 'bonds.support.family_label',
    descriptionKey: 'bonds.support.family_description',
  },
  [BondType.ROD]: {
    shortLabel: 'Family-only',
    tone: 'caution',
    description:
      'Family-targeted bond. Only use when household eligibility assumptions actually apply.',
    shortLabelKey: 'bonds.support.family_label',
    descriptionKey: 'bonds.support.family_description',
  },
};

export function isFamilyBondType(type: BondType) {
  return FAMILY_BOND_TYPES.includes(type);
}

export function supportsRetirementBondType(type: BondType) {
  return RETIREMENT_SUPPORTED_BOND_TYPES.includes(type);
}

export function getBondSupportMeta(type: BondType, language?: AppLanguage): BondSupportMeta {
  const meta = SUPPORT_META[type] ?? DEFAULT_SUPPORT_META;

  if (!language) {
    return meta;
  }

  return {
    ...meta,
    shortLabel: meta.shortLabelKey
      ? translateMessage(language, meta.shortLabelKey)
      : meta.shortLabel,
    description: meta.descriptionKey
      ? translateMessage(language, meta.descriptionKey)
      : meta.description,
  };
}

export function getRetirementSupportNote(type: BondType) {
  if (supportsRetirementBondType(type)) {
    return 'Uses one steady annualized rate for the selected bond family. Good for rough withdrawal stress tests, not retirement advice.';
  }

  if (isFamilyBondType(type)) {
    return 'Family bonds are excluded here. This withdrawal page stays limited to broadly comparable public bond types.';
  }

  return 'OTS is excluded here because a 3-month product is too short for this steady-rate withdrawal model.';
}
