import { getTranslations } from 'next-intl/server';
import { getLocalizedPageMetadata } from '@/lib/page-metadata';
import { signIn } from '@/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export async function generateMetadata() {
  return getLocalizedPageMetadata('login');
}

const providers = [
  {
    id: 'google',
    labelKey: 'login.providers.google',
    icon: 'G',
  },
  {
    id: 'facebook',
    labelKey: 'login.providers.facebook',
    icon: 'f',
  },
] as const;

export default async function LoginPage() {
  const t = await getTranslations();

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col justify-center px-6 py-16">
      <section className="space-y-8">
        <div className="space-y-3 border-b border-border pb-6">
          <p className="ui-meta font-semibold text-muted-foreground">
            {t('login.eyebrow')}
          </p>
          <h1 className="ui-page-title text-foreground">
            {t('login.title')}
          </h1>
          <p className="ui-body max-w-2xl text-muted-foreground">
            {t('login.description')}
          </p>
        </div>

        <Card className="rounded-md border-border shadow-none">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base">
              {t('login.provider_title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {providers.map((provider) => {
              return (
                <form
                  key={provider.id}
                  action={async () => {
                    'use server';
                    await signIn(provider.id, { redirectTo: '/notebook' });
                  }}
                >
                  <Button
                    type="submit"
                    variant="outline"
                    className="h-11 w-full justify-start gap-3 rounded-md border-border"
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-border text-[10px] font-black uppercase">
                      {provider.icon}
                    </span>
                    {t(provider.labelKey)}
                  </Button>
                </form>
              );
            })}
            <p className="ui-caption text-muted-foreground">
              {t('login.oauth_only_note')}
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
