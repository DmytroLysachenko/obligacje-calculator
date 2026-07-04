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

export type EducationIconDefinition = {
  key: string;
  icon: ComponentType<{ className?: string }>;
};

export type StarterGuideDefinition = EducationIconDefinition & {
  bonds: string;
};

export const educationConcepts: EducationIconDefinition[] = [
  { key: 'inflation', icon: TrendingDown },
  { key: 'margin', icon: Target },
  { key: 'capitalization', icon: Layers },
  { key: 'belka_tax', icon: Percent },
  { key: 'early_redemption', icon: LogOut },
];

export const starterGuides: StarterGuideDefinition[] = [
  {
    key: 'short_term',
    icon: Clock,
    bonds: 'OTS / ROR',
  },
  {
    key: 'inflation',
    icon: ShieldCheck,
    bonds: 'COI / EDO',
  },
  {
    key: 'family',
    icon: Users,
    bonds: 'ROS / ROD',
  },
  {
    key: 'long_term',
    icon: Target,
    bonds: 'EDO / ROD',
  },
];
