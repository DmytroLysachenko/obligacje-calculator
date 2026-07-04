import { BarChart2, BookOpen, Calculator, Layers, Scale, TrendingUp, Wallet } from 'lucide-react';
import type { ComponentType } from 'react';

import type { FeatureStatus } from '@/shared/components/feedback/FeatureStatusNotice';

export type HomeToolDefinition = {
  href: string;
  titleKey: string;
  descriptionKey: string;
  icon: ComponentType<{ className?: string }>;
  status: FeatureStatus;
};

export const heroTrustStripKeys = ['item_1', 'item_2', 'item_3'] as const;

export const homeStepIds = ['learn-rules', 'run-one', 'expand-later'] as const;

export const primaryHomeTools: HomeToolDefinition[] = [
  {
    href: '/single-calculator',
    titleKey: 'nav.single_calculator',
    descriptionKey: 'landing.cards.single_calculator',
    icon: Calculator,
    status: 'trusted',
  },
  {
    href: '/education',
    titleKey: 'nav.education',
    descriptionKey: 'landing.cards.education',
    icon: BookOpen,
    status: 'trusted',
  },
  {
    href: '/economic-data',
    titleKey: 'nav.economic_data',
    descriptionKey: 'landing.cards.economic_data',
    icon: BarChart2,
    status: 'reference',
  },
];

export const secondaryHomeTools: HomeToolDefinition[] = [
  {
    href: '/compare',
    titleKey: 'nav.comparison',
    descriptionKey: 'landing.cards.comparison',
    icon: Scale,
    status: 'conditional',
  },
  {
    href: '/regular-investment',
    titleKey: 'nav.regular_investment',
    descriptionKey: 'landing.cards.regular_investment',
    icon: TrendingUp,
    status: 'conditional',
  },
  {
    href: '/ladder',
    titleKey: 'nav.ladder',
    descriptionKey: 'landing.cards.ladder',
    icon: Layers,
    status: 'conditional',
  },
  {
    href: '/notebook',
    titleKey: 'nav.notebook',
    descriptionKey: 'landing.recovery_home.notebook_card',
    icon: Wallet,
    status: 'conditional',
  },
];
