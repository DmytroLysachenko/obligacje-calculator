import { BondType } from '@/features/bond-core/types';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export interface BondRateContextCopy {
  styleLabel: string;
  firstPeriodLabel: string;
  firstPeriodValueLabel: string;
  laterPeriodsLabel?: string;
  narrative: string;
}

export function getBondRateContextCopy(
  bondType: BondType,
  firstPeriodRate: number,
  margin: number,
  t: TranslateFn,
): BondRateContextCopy {
  const rateLabel = `${firstPeriodRate.toFixed(2)}%`;

  if (bondType === BondType.ROR || bondType === BondType.DOR) {
    const marginLabel = `${margin >= 0 ? '+' : ''}${margin.toFixed(2)}%`;

    return {
      styleLabel: t('bonds.rate_context.floating_style'),
      firstPeriodLabel: t('bonds.rate_context.first_month_offer'),
      firstPeriodValueLabel: rateLabel,
      laterPeriodsLabel: t('bonds.rate_context.later_nbp_rule', { margin: marginLabel }),
      narrative: t('bonds.rate_context.floating_narrative', { margin: marginLabel }),
    };
  }

  if ([BondType.COI, BondType.EDO, BondType.ROS, BondType.ROD].includes(bondType)) {
    const marginLabel = `${margin >= 0 ? '+' : ''}${margin.toFixed(2)}%`;

    return {
      styleLabel: t('bonds.rate_context.indexed_style'),
      firstPeriodLabel: t('bonds.rate_context.first_year_offer'),
      firstPeriodValueLabel: rateLabel,
      laterPeriodsLabel: t('bonds.rate_context.later_cpi_rule', { margin: marginLabel }),
      narrative: t('bonds.rate_context.indexed_narrative', { margin: marginLabel }),
    };
  }

  return {
    styleLabel: t('bonds.rate_context.fixed_style'),
    firstPeriodLabel:
      bondType === BondType.OTS
        ? t('bonds.rate_context.fixed_full_term')
        : t('bonds.rate_context.fixed_schedule'),
    firstPeriodValueLabel: rateLabel,
    narrative: t('bonds.rate_context.fixed_narrative'),
  };
}
