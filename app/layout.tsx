import type {Metadata} from 'next';
import React from 'react';
import Script from 'next/script';
import {Geist, Geist_Mono, Inter} from 'next/font/google';
import {NextIntlClientProvider} from 'next-intl';
import {getLocale, getMessages, getTranslations} from 'next-intl/server';
import './globals.css';
import {TooltipProvider} from '@/components/ui/tooltip';
import {AppLocaleProvider} from '@/i18n/client';
import {defaultLocale, type Language} from '@/i18n/config';
import {getMetadataLocale} from '@/i18n/locale-utils';
import {getGlobalDataFreshness} from '@/lib/data/market-data';
import {ErrorBoundary} from '@/shared/components/ErrorBoundary';
import {OpportunisticSyncTrigger} from '@/shared/components/OpportunisticSyncTrigger';
import {Sidebar} from '@/shared/components/Sidebar';
import {BondDefinitionsProvider} from '@/shared/context/BondDefinitionsContext';
import {ChartSyncProvider} from '@/shared/context/ChartSyncContext';

const geistSans = Geist({variable: '--font-geist-sans', subsets: ['latin']});
const geistMono = Geist_Mono({variable: '--font-geist-mono', subsets: ['latin']});
const inter = Inter({variable: '--font-inter', subsets: ['latin']});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const language = (locale as Language) || defaultLocale;
  const t = await getTranslations();

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    title: {
      default: `${t('common.title')} - ${t('generated.app.layout.item_1')}`,
      template: `%s | ${t('common.title')}`
    },
    description: t('common.description'),
    manifest: '/manifest.json',
    openGraph: {
      type: 'website',
      locale: getMetadataLocale(language),
      url: 'https://obligacje-calculator.vercel.app',
      siteName: t('common.title')
    },
    twitter: {
      card: 'summary_large_image',
      title: t('common.title'),
      description: t('generated.app.layout.item_3')
    }
  };
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dataFreshness = await getGlobalDataFreshness();
  const locale = await getLocale();
  const messages = await getMessages();
  const language = (locale as Language) || defaultLocale;
  const t = await getTranslations();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'Obligacje Calculator',
        description: 'Educational calculator for Polish Treasury Bonds.',
        url: 'https://obligacje-calculator.vercel.app',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'PLN'
        },
        potentialAction: {
          '@type': 'CalculateAction',
          name: 'Calculate Bond Profit',
          target: 'https://obligacje-calculator.vercel.app/single-calculator'
        }
      },
      {
        '@type': 'FinancialProduct',
        name: 'Polish Treasury Bonds',
        description: 'EDO, COI, ROR, DOR, TOS, OTS bond calculations.',
        provider: {
          '@type': 'GovernmentOrganization',
          name: 'Ministerstwo Finansow'
        }
      }
    ]
  };

  return (
    <html lang={language} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} bg-background text-foreground antialiased`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}} />
        <NextIntlClientProvider locale={language} messages={messages}>
          <AppLocaleProvider>
            <BondDefinitionsProvider>
              <ChartSyncProvider>
                <TooltipProvider>
                  <ErrorBoundary>
                    <div className="flex min-h-screen">
                      <Sidebar dataFreshness={dataFreshness} />
                      <OpportunisticSyncTrigger />
                      <main className="flex min-h-screen flex-1 flex-col overflow-x-hidden border-l border-slate-200/70 bg-[radial-gradient(circle_at_top_left,rgba(226,232,240,0.35),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.98)_100%)] lg:pl-[22rem]">
                        <div className="flex-1 px-4 py-4 md:px-8 md:py-8">
                          <div className="container mx-auto max-w-[1320px]">{children}</div>
                        </div>

                        <footer className="mt-auto border-t border-slate-200/70 bg-white/70 py-8 backdrop-blur">
                          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                            <p>
                              © {new Date().getFullYear()} {t('common.title')}.{' '}
                              {t('generated.app.layout.item_4')}
                            </p>
                            <div className="mt-4 flex justify-center gap-4">
                              <a
                                href="https://www.obligacjeskarbowe.pl/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {t('generated.app.layout.item_5')}
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

