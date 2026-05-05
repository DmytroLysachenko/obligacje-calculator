import Link from 'next/link';
import { Metadata } from 'next';
import { BarChart2, Calendar, FlaskConical, ShieldAlert, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FeatureStatusNotice, FeatureStatusPill } from '@/shared/components/FeatureStatusNotice';

export const metadata: Metadata = {
  title: 'Recovery Lab',
  description:
    'Limited and experimental calculator surfaces kept reachable during the product recovery refactor.',
};

const recoveryLabPages = [
  {
    href: '/optimize',
    title: 'Scenario Ranking',
    description:
      'Assumption-sensitive payout sorting. Useful as a supporting scenario view, not as a recommendation surface.',
    status: 'experimental' as const,
    icon: TrendingUp,
  },
  {
    href: '/multi-asset',
    title: 'Historical Reference Comparison',
    description:
      'Mixed-series comparison with narrower trust than the core bond calculators. Keep it in reference mode only.',
    status: 'experimental' as const,
    icon: BarChart2,
  },
  {
    href: '/retirement',
    title: 'Withdrawal Model',
    description:
      'Limited steady-rate withdrawal scenario. Narrower than a normal retirement planner and intentionally scoped down.',
    status: 'limited' as const,
    icon: Calendar,
  },
];

export default function RecoveryLabPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-900">
          <FlaskConical className="h-6 w-6 text-amber-600" />
          <h1 className="text-3xl font-black tracking-tight">Recovery Lab</h1>
        </div>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          These surfaces remain reachable during the recovery refactor, but they are not part of the
          primary calculator promise. Each one is narrower, more assumption-sensitive, or more data-dependent
          than the core flows.
        </p>
      </div>

      <FeatureStatusNotice status="experimental" title="Why these tools are separated">
        The app now emphasizes core calculator and reference pages first. Recovery-lab pages stay available for
        investigation and iterative validation, but they should not compete with the flagship calculator flows
        until their scope and evidence improve further.
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
                  <CardTitle className="text-xl">{page.title}</CardTitle>
                  <CardDescription className="mt-2 text-sm leading-6 text-slate-700">
                    {page.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded-2xl border border-amber-200 bg-white/70 px-4 py-3 text-sm leading-6 text-slate-700">
                  Open this page only when you want to inspect a narrower or weaker-support scenario surface on purpose.
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
            What stays core
          </CardTitle>
          <CardDescription>
            Recovery is moving toward a simpler product with clearer trust boundaries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
          <p>Primary emphasis remains on education, single calculator, comparison, regular investment, ladder, notebook, and data reference pages.</p>
          <p>Recovery-lab pages can still improve later, but they do not define product readiness right now.</p>
        </CardContent>
      </Card>
    </div>
  );
}
