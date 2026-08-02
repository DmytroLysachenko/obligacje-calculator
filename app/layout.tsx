import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { headers } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import React from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';
import { AppLocaleProvider } from '@/i18n/client';
import { defaultLocale, type Language } from '@/i18n/config';
import { getMetadataLocale } from '@/i18n/locale-utils';
import { createAppJsonLd, serializeJsonLd } from '@/lib/seo/app-json-ld';
import { getCanonicalBaseUrl, isIndexableDeployment } from '@/lib/site-url';
import { RouteFocusManager } from '@/shared/components/accessibility/RouteFocusManager';
import { OpportunisticSyncTrigger } from '@/shared/components/chrome/OpportunisticSyncTrigger';
import { Sidebar } from '@/shared/components/chrome/Sidebar';
import { ErrorBoundary } from '@/shared/components/feedback/ErrorBoundary';
import { WebVitalsReporter } from '@/shared/components/observability/WebVitalsReporter';
import { BondDefinitionsProvider } from '@/shared/context/BondDefinitionsContext';
import { ChartSyncProvider } from '@/shared/context/ChartSyncContext';
import { ThemeProvider } from '@/shared/context/ThemeContext';

import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  themeColor: '#f8f6f1',
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const language = (locale as Language) || defaultLocale;
  const t = await getTranslations();
  const canonicalBaseUrl = getCanonicalBaseUrl();
  const indexable = isIndexableDeployment();

  return {
    metadataBase: new URL(canonicalBaseUrl),
    title: {
      default: `${t('common.title')} - ${t('site.default_title_suffix')}`,
      template: `%s | ${t('common.title')}`,
    },
    description: t('common.description'),
    icons: {
      icon: [{ url: '/app-icon.svg', type: 'image/svg+xml' }],
      apple: [{ url: '/app-icon.svg', type: 'image/svg+xml' }],
    },
    robots: indexable ? undefined : { index: false, follow: false },
    openGraph: {
      type: 'website',
      locale: getMetadataLocale(language),
      url: canonicalBaseUrl,
      siteName: t('common.title'),
      images: [
        {
          url: '/bonds-preview.png',
          width: 1536,
          height: 1024,
          alt: 'Kalkulator Obligacji Skarbowych — calculator preview',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('common.title'),
      description: t('site.twitter_description'),
      images: ['/bonds-preview.png'],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const language = (locale as Language) || defaultLocale;
  const t = await getTranslations();
  const canonicalBaseUrl = getCanonicalBaseUrl();
  const nonce = (await headers()).get('x-csp-nonce') ?? undefined;

  const jsonLd = createAppJsonLd({
    appName: 'Obligacje Calculator',
    description: 'Educational calculator for Polish Treasury Bonds.',
    baseUrl: canonicalBaseUrl,
  });

  return (
    <html lang={language} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <script
          nonce={nonce}
          suppressHydrationWarning
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
        <NextIntlClientProvider locale={language} messages={messages}>
          <AppLocaleProvider>
            <ThemeProvider>
              <BondDefinitionsProvider>
                <ChartSyncProvider>
                  <TooltipProvider>
                    <ErrorBoundary>
                      <div className="flex min-h-screen bg-background">
                        <WebVitalsReporter />
                        <RouteFocusManager />
                        <a
                          href="#main-content"
                          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {t('common.skip_to_content')}
                        </a>
                        <Sidebar />
                        <OpportunisticSyncTrigger />
                        <main
                          id="main-content"
                          tabIndex={-1}
                          className="flex min-h-screen flex-1 flex-col overflow-x-hidden bg-background pt-14 outline-none lg:pl-[var(--sidebar-width)] lg:pt-0"
                        >
                          <div className="flex-1 px-4 py-6 md:px-8 md:py-8 xl:px-10">
                            <div className="mx-auto w-full max-w-[var(--layout-app-max)]">
                              {children}
                            </div>
                          </div>

                          <footer className="mt-auto border-t border-border bg-background py-6">
                            <div className="px-4 md:px-8 xl:px-10">
                              <div className="mx-auto w-full max-w-[var(--layout-app-max)] text-center text-sm text-muted-foreground">
                                <p>
                                  {'\u00A9'} {new Date().getFullYear()} {t('common.title')}.{' '}
                                  {t('site.footer_disclaimer')}
                                </p>
                                <div className="mt-4 flex justify-center gap-4">
                                  <a
                                    href="https://www.obligacjeskarbowe.pl/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    {t('site.official_bonds_link_label')}
                                  </a>
                                </div>
                              </div>
                            </div>
                          </footer>
                        </main>
                      </div>
                    </ErrorBoundary>
                  </TooltipProvider>
                </ChartSyncProvider>
              </BondDefinitionsProvider>
            </ThemeProvider>
          </AppLocaleProvider>
        </NextIntlClientProvider>

      </body>
    </html>
  );
}
