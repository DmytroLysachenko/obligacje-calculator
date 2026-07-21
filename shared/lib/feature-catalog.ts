import type { FeatureStatus } from '@/shared/types/feature-status';

export type FeaturePlacement = 'primary' | 'preview' | 'recovery-lab';

export type FeatureDefinition = {
  route: string;
  navigationSection: 'core' | 'conditional' | 'recovery_lab';
  status: FeatureStatus;
  placement: FeaturePlacement;
  admittedToTrustedRelease: boolean;
  titleKey: string;
  descriptionKey: string;
};

const featureCatalog = [
  {
    route: '/single-calculator',
    navigationSection: 'core',
    status: 'trusted',
    placement: 'primary',
    admittedToTrustedRelease: true,
    titleKey: 'nav.single_calculator',
    descriptionKey: 'landing.cards.single_calculator',
  },
  {
    route: '/economic-data',
    navigationSection: 'core',
    status: 'reference',
    placement: 'primary',
    admittedToTrustedRelease: true,
    titleKey: 'nav.economic_data',
    descriptionKey: 'landing.cards.economic_data',
  },
  {
    route: '/education',
    navigationSection: 'core',
    status: 'trusted',
    placement: 'primary',
    admittedToTrustedRelease: true,
    titleKey: 'nav.education',
    descriptionKey: 'landing.cards.education',
  },
  {
    route: '/compare',
    navigationSection: 'conditional',
    status: 'conditional',
    placement: 'preview',
    admittedToTrustedRelease: false,
    titleKey: 'nav.comparison',
    descriptionKey: 'landing.cards.comparison',
  },
  {
    route: '/regular-investment',
    navigationSection: 'conditional',
    status: 'conditional',
    placement: 'preview',
    admittedToTrustedRelease: false,
    titleKey: 'nav.regular_investment',
    descriptionKey: 'landing.cards.regular_investment',
  },
  {
    route: '/ladder',
    navigationSection: 'conditional',
    status: 'conditional',
    placement: 'preview',
    admittedToTrustedRelease: false,
    titleKey: 'nav.ladder',
    descriptionKey: 'landing.cards.ladder',
  },
  {
    route: '/notebook',
    navigationSection: 'conditional',
    status: 'conditional',
    placement: 'preview',
    admittedToTrustedRelease: false,
    titleKey: 'nav.notebook',
    descriptionKey: 'landing.recovery_home.notebook_card',
  },
] as const satisfies readonly FeatureDefinition[];

export function getFeaturesForPlacement(placement: FeaturePlacement): readonly FeatureDefinition[] {
  return featureCatalog.filter((feature) => feature.placement === placement);
}

export function getFeaturesForNavigation(
  navigationSection: FeatureDefinition['navigationSection'],
): readonly FeatureDefinition[] {
  return featureCatalog.filter((feature) => feature.navigationSection === navigationSection);
}

export function getTrustedReleaseFeatures(): readonly FeatureDefinition[] {
  return featureCatalog.filter((feature) => feature.admittedToTrustedRelease);
}
