import Link from 'next/link';
import { Github } from 'lucide-react';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export async function generateMetadata() {
  return getLocalizedPageMetadata('login');
}

const providers = [
  {
    id: 'google',
    label: 'Continue with Google',
    href: '/api/auth/signin/google',
    icon: null,
  },
  {
    id: 'github',
    label: 'Continue with GitHub',
    href: '/api/auth/signin/github',
    icon: Github,
  },
] as const;

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col justify-center px-6 py-16">
      <section className="space-y-8">
        <div className="space-y-3 border-b border-border pb-6">
          <p className="ui-meta font-semibold text-muted-foreground">
            Portfolio workspace
          </p>
          <h1 className="ui-page-title text-foreground">
            Sign in to save bond portfolios
          </h1>
          <p className="ui-body max-w-2xl text-muted-foreground">
            Calculators stay available without an account. Saving lots, importing portfolios,
            sharing portfolio links, and exporting notebook data require an authenticated workspace.
          </p>
        </div>

        <Card className="rounded-md border-border shadow-none">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base">
              Choose an OAuth provider
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {providers.map((provider) => {
              const Icon = provider.icon;

              return (
                <Button
                  key={provider.id}
                  asChild
                  variant="outline"
                  className="h-11 w-full justify-start gap-3 rounded-md border-border"
                >
                  <Link href={provider.href}>
                    {Icon ? <Icon className="h-4 w-4" /> : <span className="h-4 w-4 rounded-full border border-border" />}
                    {provider.label}
                  </Link>
                </Button>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
