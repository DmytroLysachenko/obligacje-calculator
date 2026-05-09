'use client';

import Link from 'next/link';
import { BarChart2, Calendar, FlaskConical, ShieldAlert, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
  const { t, language } = useLanguage();

  const intro =
    language === 'pl'
      ? 'Te strony pozostaja dostepne, ale nie powinny konkurowac wizualnie z glowna czescia produktu. To boczne laboratorium, nie frontowa obietnica aplikacji.'
      : 'These pages remain reachable, but they should not compete visually with the core product. This is a side lab, not the front-door promise of the app.';

  return (
    <div className="space-y-8">
      <Card className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,250,252,0.92))] shadow-[0_20px_52px_-46px_rgba(15,23,42,0.42)] backdrop-blur">
        <CardContent className="space-y-4 p-6 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700">
            <FlaskConical className="h-3.5 w-3.5 text-amber-700" />
            {t('landing.recovery_lab_page.eyebrow')}
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              {t('landing.recovery_lab_page.title')}
            </h1>
            <p className="max-w-4xl text-sm leading-8 text-slate-600">{intro}</p>
          </div>
        </CardContent>
      </Card>

      <FeatureStatusNotice
        status="experimental"
        eyebrow={t('landing.recovery_lab_page.eyebrow')}
        title={t('landing.recovery_lab_page.why_separated')}
      >
        {t('landing.recovery_lab_page.why_separated_desc')}
      </FeatureStatusNotice>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {recoveryLabPages.map((page) => (
          <Link key={page.href} href={page.href} className="group block h-full">
            <Card className="h-full overflow-hidden rounded-[2rem] border border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.95),rgba(255,255,255,0.92))] shadow-[0_18px_48px_-40px_rgba(120,53,15,0.22)] transition-colors group-hover:border-amber-300">
              <CardContent className="space-y-5 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-2xl bg-white p-3 text-amber-700 shadow-sm">
                    <page.icon className="h-5 w-5" />
                  </div>
                  <FeatureStatusPill status={page.status} />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-black tracking-tight text-slate-950">
                    {t(`landing.recovery_lab_page.pages.${page.i18nKey}.title`)}
                  </p>
                  <p className="text-sm leading-7 text-slate-600">
                    {t(`landing.recovery_lab_page.pages.${page.i18nKey}.description`)}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-white/75 px-4 py-3 text-sm leading-7 text-slate-700">
                  {t('landing.recovery_lab_page.card_notice')}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="rounded-[2rem] border border-slate-200 bg-white/86 shadow-[0_16px_42px_-38px_rgba(15,23,42,0.38)] backdrop-blur">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2 text-slate-950">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <p className="text-xl font-black tracking-tight">
              {t('landing.recovery_lab_page.what_stays_core')}
            </p>
          </div>
          <p className="text-sm leading-7 text-slate-600">
            {t('landing.recovery_lab_page.what_stays_core_desc')}
          </p>
          <div className="space-y-2 text-sm leading-7 text-slate-600">
            <p>{t('landing.recovery_lab_page.core_emphasis')}</p>
            <p>{t('landing.recovery_lab_page.core_improve_later')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
