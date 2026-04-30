import type { Metadata } from 'next';
import React from 'react';
import Script from 'next/script';
import { cookies } from 'next/headers';
import { Geist, Geist_Mono, Inter } from 'next/font/google';
import './globals.css';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LanguageProvider, translations, Language } from '@/i18n';
import { resolveTranslationValue } from '@/i18n/translation-utils';
import { getGlobalDataFreshness } from '@/lib/data-access';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { OpportunisticSyncTrigger } from '@/shared/components/OpportunisticSyncTrigger';
import { Sidebar } from '@/shared/components/Sidebar';
import { BondDefinitionsProvider } from '@/shared/context/BondDefinitionsContext';
import { ChartSyncProvider } from '@/shared/context/ChartSyncContext';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const language = (cookieStore.get('app-language')?.value as Language) || 'pl';
  const t = (key: string) => resolveTranslationValue(translations, language, key);

  return {
    title: {
      default: `${t('common.title')} - ${language === 'pl' ? 'Symulator Polskich Obligacji Skarbowych' : 'Polish Treasury Bonds Simulator'}`,
      template: `%s | ${t('common.title')}`,
    },
    description: t('common.description'),
    manifest: '/manifest.json',
    openGraph: {
      type: 'website',
      locale: language === 'pl' ? 'pl_PL' : 'en_US',
      url: 'https://obligacje-calculator.vercel.app',
      siteName: t('common.title'),
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: t('common.title'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('common.title'),
      description:
        language === 'pl'
          ? 'Symulator Polskich Obligacji Skarbowych'
          : 'Polish Treasury Bonds Simulator',
      images: ['/og-image.png'],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dataFreshness = await getGlobalDataFreshness();
  const cookieStore = await cookies();
  const language = (cookieStore.get('app-language')?.value as Language) || 'pl';
  const t = (key: string) => resolveTranslationValue(translations, language, key);

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
          priceCurrency: 'PLN',
        },
        potentialAction: {
          '@type': 'CalculateAction',
          name: 'Calculate Bond Profit',
          target:
            'https://obligacje-calculator.vercel.app/single-calculator',
        },
      },
      {
        '@type': 'FinancialProduct',
        name: 'Polish Treasury Bonds',
        description: 'EDO, COI, ROR, DOR, TOS, OTS bond calculations.',
        provider: {
          '@type': 'GovernmentOrganization',
          name: 'Ministerstwo Finansow',
        },
      },
    ],
  };

  return (
    <html lang={language} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} bg-background text-foreground antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LanguageProvider initialLanguage={language}>
          <BondDefinitionsProvider>
            <ChartSyncProvider>
              <TooltipProvider>
                <ErrorBoundary>
                  <div className="flex min-h-screen">
                    <Sidebar dataFreshness={dataFreshness} />
                    <OpportunisticSyncTrigger />
                    <main className="flex min-h-screen flex-1 flex-col overflow-x-hidden border-l lg:pl-72">
                      <div className="flex-1 p-4 md:p-8">
                        <div className="container mx-auto max-w-7xl">
                          {children}
                        </div>
                      </div>

                      <footer className="mt-auto border-t bg-muted/50 py-8">
                        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                          <p>
                            © {new Date().getFullYear()} {t('common.title')}.{' '}
                            {language === 'pl'
                              ? 'Wylacznie do celow edukacyjnych.'
                              : 'For educational purposes only.'}
                          </p>
                          <div className="mt-4 flex justify-center gap-4">
                            <a
                              href="https://www.obligacjeskarbowe.pl/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {language === 'pl'
                                ? 'Oficjalna strona Obligacji Skarbowych'
                                : 'Official Polish Bonds Website'}
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
        </LanguageProvider>

        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
