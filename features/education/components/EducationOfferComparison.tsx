'use client';

import Link from 'next/link';

import type { BondDefinition } from '@/features/bond-core/constants/bond-definitions';
import { educationOfferGroups } from '@/features/education/constants/education-content';
import { useAppI18n } from '@/i18n/client';
import { formatBondDuration } from '@/shared/lib/format-bond-duration';

function rateBasis(bond: BondDefinition, t: ReturnType<typeof useAppI18n>['t']) {
  if (bond.isInflationIndexed) return t('education.comparison.inflation_indexed');
  if (bond.isFloating) return t('education.comparison.reference_rate');
  return t('education.comparison.fixed_rate');
}

export function EducationOfferComparison({
  definitions,
}: {
  definitions: Record<string, BondDefinition>;
}) {
  const { t, locale } = useAppI18n();
  const bonds = educationOfferGroups.flatMap((group) =>
    group.bondTypes
      .map((type) => definitions[type])
      .filter((bond): bond is BondDefinition => Boolean(bond)),
  );

  return (
    <div className="space-y-3">
      <p className="ui-table-scroll-hint">{t('education.comparison.scroll_hint')}</p>
      <div className="ui-table-frame">
        <div className="ui-table-scroll-region" tabIndex={0}>
          <table className="w-full min-w-[760px] border-collapse text-left text-xs">
            <caption className="ui-table-caption">{t('education.comparison.caption')}</caption>
            <thead className="border-b border-border bg-muted/25 text-muted-foreground">
              <tr>
                {['bond', 'term', 'basis', 'first_rate', 'payout', 'exit_fee'].map((key) => (
                  <th key={key} scope="col" className="px-3 py-3 font-semibold whitespace-nowrap">
                    {t(`education.comparison.${key}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bonds.map((bond) => (
                <tr key={bond.type} className="hover:bg-muted/20">
                  <th scope="row" className="px-3 py-3 text-sm font-semibold text-foreground">
                    <Link href={`#bond-${bond.type}`} className="ui-focus-ring rounded-sm">
                      {bond.name}
                    </Link>
                  </th>
                  <td className="px-3 py-3 text-muted-foreground">
                    {formatBondDuration(bond.duration, locale)}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{rateBasis(bond, t)}</td>
                  <td className="px-3 py-3 font-mono font-semibold tabular-nums text-foreground">
                    {bond.firstYearRate}%
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {bond.isCapitalized ? t('bonds.capitalization') : t('bonds.payout')}
                  </td>
                  <td className="px-3 py-3 font-mono tabular-nums text-muted-foreground">
                    {bond.earlyWithdrawalFee.toLocaleString(locale)} PLN
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
