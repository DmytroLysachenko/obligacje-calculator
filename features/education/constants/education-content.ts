import {
  Clock,
  Layers,
  LogOut,
  Percent,
  ShieldCheck,
  Target,
  TrendingDown,
  Users,
} from 'lucide-react';
import type { ComponentType } from 'react';

import { BondType } from '@/features/bond-core/types';

export type EducationIconDefinition = {
  key: string;
  icon: ComponentType<{ className?: string }>;
};

export type EducationOfferGroup = EducationIconDefinition & {
  bondTypes: readonly BondType[];
};

export type EducationDecisionRoute = EducationIconDefinition & {
  bondTypes: readonly BondType[];
  groupKey: EducationOfferGroup['key'];
};

export const educationConcepts: readonly EducationIconDefinition[] = [
  { key: 'inflation', icon: TrendingDown },
  { key: 'margin', icon: Target },
  { key: 'capitalization', icon: Layers },
];

export const educationSecondaryConcepts: readonly EducationIconDefinition[] = [
  { key: 'belka_tax', icon: Percent },
  { key: 'early_redemption', icon: LogOut },
];

export const educationOfferGroups: readonly EducationOfferGroup[] = [
  { key: 'fixed', icon: Clock, bondTypes: [BondType.OTS, BondType.TOS] },
  { key: 'reference', icon: Target, bondTypes: [BondType.ROR, BondType.DOR] },
  { key: 'inflation', icon: TrendingDown, bondTypes: [BondType.COI, BondType.EDO] },
  { key: 'family', icon: Users, bondTypes: [BondType.ROS, BondType.ROD] },
];

export const educationDecisionRoutes: readonly EducationDecisionRoute[] = [
  { key: 'short_term', icon: Clock, bondTypes: [BondType.OTS, BondType.TOS], groupKey: 'fixed' },
  {
    key: 'inflation',
    icon: ShieldCheck,
    bondTypes: [BondType.COI, BondType.EDO],
    groupKey: 'inflation',
  },
  { key: 'family', icon: Users, bondTypes: [BondType.ROS, BondType.ROD], groupKey: 'family' },
  {
    key: 'long_term',
    icon: Target,
    bondTypes: [BondType.EDO, BondType.ROD],
    groupKey: 'inflation',
  },
];

export function getEducationOfferGroup(key: string) {
  return educationOfferGroups.find((group) => group.key === key);
}
