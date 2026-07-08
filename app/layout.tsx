import type { Metadata } from 'next';
import { Geist, Geist_Mono, Inter } from 'next/font/google';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import React from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';
import { AppLocaleProvider } from '@/i18n/client';
import { defaultLocale, type Language } from '@/i18n/config';
import { getMetadataLocale } from '@/i18n/locale-utils';
import { getGlobalDataFreshness } from '@/lib/data/market-data';
import { createAppJsonLd } from '@/lib/seo/app-json-ld';
import { getCanonicalBaseUrl } from '@/lib/site-url';
import { OpportunisticSyncTrigger } from '@/shared/components/chrome/OpportunisticSyncTrigger';
import { Sidebar } from '@/shared/components/chrome/Sidebar';
import { ErrorBoundary } from '@/shared/components/feedback/ErrorBoundary';
import { BondDefinitionsProvider } from '@/shared/context/BondDefinitionsContext';
import { ChartSyncProvider } from '@/shared/context/ChartSyncContext';

import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const language = (locale as Language) || defaultLocale;
  const t = await getTranslations();
  const canonicalBaseUrl = getCanonicalBaseUrl();

  return {
    metadataBase: new URL(canonicalBaseUrl),
    title: {
      default: `${t('common.title')} - ${t('site.default_title_suffix')}`,
      template: `%s | ${t('common.title')}`,
    },
    description: t('common.description'),
    manifest: '/manifest.json',
    openGraph: {
      type: 'website',
      locale: getMetadataLocale(language),
      url: canonicalBaseUrl,
      siteName: t('common.title'),
    },
    twitter: {
      card: 'summary_large_image',
      title: t('common.title'),
      description: t('site.twitter_description'),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dataFreshness = await getGlobalDataFreshness();
  const locale = await getLocale();
  const messages = await getMessages();
  const language = (locale as Language) || defaultLocale;
  const t = await getTranslations();
  const canonicalBaseUrl = getCanonicalBaseUrl();

  const jsonLd = createAppJsonLd({
    appName: 'Obligacje Calculator',
    description: 'Educational calculator for Polish Treasury Bonds.',
    baseUrl: canonicalBaseUrl,
  });

  return (
    <html lang={language} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} bg-background text-foreground antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <NextIntlClientProvider locale={language} messages={messages}>
          <AppLocaleProvider>
            <BondDefinitionsProvider>
              <ChartSyncProvider>
                <TooltipProvider>
                  <ErrorBoundary>
                    <div className="flex min-h-screen bg-background">
                      <a
                        href="#main-content"
                        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {t('common.skip_to_content')}
                      </a>
                      <Sidebar dataFreshness={dataFreshness} />
                      <OpportunisticSyncTrigger />
                      <main
                        id="main-content"
                        tabIndex={-1}
                        className="flex min-h-screen flex-1 flex-col overflow-x-hidden bg-background outline-none lg:pl-[var(--sidebar-width)]"
                      >
                        <div className="flex-1 px-4 py-6 md:px-8 md:py-8 xl:px-10">
                          <div className="mx-auto w-full max-w-[var(--layout-app-max)]">
                            {children}
                          </div>
                        </div>

                        <footer className="mt-auto border-t border-border bg-card py-6">
                          <div className="mx-auto w-full max-w-[var(--layout-app-max)] px-4 text-center text-sm text-muted-foreground">
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
                        </footer>
                      </main>
                    </div>
                  </ErrorBoundary>
                </TooltipProvider>
              </ChartSyncProvider>
            </BondDefinitionsProvider>
          </AppLocaleProvider>
        </NextIntlClientProvider>

        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', async function() {
                const isLocalhost =
                  window.location.hostname === 'localhost' ||
                  window.location.hostname === '127.0.0.1';

                if (${process.env.NODE_ENV === 'production'} && !isLocalhost) {
                  await navigator.serviceWorker.register('/sw.js');
                  return;
                }

                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map((registration) => registration.unregister()));

                if ('caches' in window) {
                  const keys = await caches.keys();
                  await Promise.all(
                    keys
                      .filter((key) => key.startsWith('bond-calculator-'))
                      .map((key) => caches.delete(key))
                  );
                }
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
