'use client';

import Link from 'next/link';
import { BarChart2, Calendar, FlaskConical, ShieldAlert, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FeatureStatusNotice, FeatureStatusPill } from '@/shared/components/FeatureStatusNotice';
import { useLanguage } from '@/i18n';

const recoveryLabPages = [
  {
    href: '/optimize',
    i18nKey: 'optimize',
    status: 'experimental' as const,
    icon: TrendingUp,
  },
  {
    href: '/multi-asset',
    i18nKey: 'multi_asset',
    status: 'experimental' as const,
    icon: BarChart2,
  },
  {
    href: '/retirement',
    i18nKey: 'retirement',
    status: 'limited' as const,
    icon: Calendar,
  },
];

export default function RecoveryLabPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-900">
          <FlaskConical className="h-6 w-6 text-amber-600" />
          <h1 className="text-3xl font-black tracking-tight">{t('landing.recovery_lab_page.title')}</h1>
        </div>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          {t('landing.recovery_lab_page.description_long')}
        </p>
      </div>

      <FeatureStatusNotice
        status="experimental"
        eyebrow={t('landing.recovery_lab_page.eyebrow')}
        title={t('landing.recovery_lab_page.why_separated')}
      >
        {t('landing.recovery_lab_page.why_separated_desc')}
      </FeatureStatusNotice>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {recoveryLabPages.map((page) => (
          <Link key={page.href} href={page.href} className="group block h-full">
            <Card className="h-full rounded-2xl border border-amber-200 bg-amber-50/50 shadow-none transition-colors group-hover:border-amber-300">
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-2xl bg-white p-3 text-amber-700 shadow-sm">
                    <page.icon className="h-6 w-6" />
                  </div>
                  <FeatureStatusPill status={page.status} />
                </div>
                <div>
                  <CardTitle className="text-xl">{t(`landing.recovery_lab_page.pages.${page.i18nKey}.title`)}</CardTitle>
                  <CardDescription className="mt-2 text-sm leading-6 text-slate-700">
                    {t(`landing.recovery_lab_page.pages.${page.i18nKey}.description`)}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded-2xl border border-amber-200 bg-white/70 px-4 py-3 text-sm leading-6 text-slate-700">
                  {t('landing.recovery_lab_page.card_notice')}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="rounded-2xl border shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldAlert className="h-5 w-5 text-primary" />
            {t('landing.recovery_lab_page.what_stays_core')}
          </CardTitle>
          <CardDescription>
            {t('landing.recovery_lab_page.what_stays_core_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
          <p>{t('landing.recovery_lab_page.core_emphasis')}</p>
          <p>{t('landing.recovery_lab_page.core_improve_later')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
