import { BarChart2, BookOpen, Calculator, Layers, Scale, TrendingUp, Wallet } from 'lucide-react';
import type { ComponentType } from 'react';

import { getFeaturesForPlacement } from '@/shared/lib/feature-catalog';
import type { FeatureStatus } from '@/shared/types/feature-status';

export type HomeToolDefinition = {
  href: string;
  titleKey: string;
  descriptionKey: string;
  icon: ComponentType<{ className?: string }>;
  status: FeatureStatus;
};

export const heroTrustStripKeys = ['item_1', 'item_2', 'item_3'] as const;

export const homeStepIds = ['learn-rules', 'run-one', 'expand-later'] as const;

const iconByRoute: Record<string, HomeToolDefinition['icon']> = {
  '/single-calculator': Calculator,
  '/education': BookOpen,
  '/economic-data': BarChart2,
  '/compare': Scale,
  '/regular-investment': TrendingUp,
  '/ladder': Layers,
  '/notebook': Wallet,
};

function toHomeToolDefinition({
  route,
  titleKey,
  descriptionKey,
  status,
}: ReturnType<typeof getFeaturesForPlacement>[number]): HomeToolDefinition {
  return { href: route, titleKey, descriptionKey, status, icon: iconByRoute[route] };
}

export const primaryHomeTools = getFeaturesForPlacement('primary').map(toHomeToolDefinition);
export const secondaryHomeTools = getFeaturesForPlacement('preview').map(toHomeToolDefinition);
