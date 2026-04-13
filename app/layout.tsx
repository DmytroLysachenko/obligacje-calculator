import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { LanguageProvider } from "@/i18n";
import { Sidebar } from "@/shared/components/Sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { OpportunisticSyncTrigger } from "@/shared/components/OpportunisticSyncTrigger";
import { getGlobalDataFreshness } from "@/lib/data-access";
import Script from "next/script";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Obligacje Calculator - Polish Treasury Bonds Simulator",
    template: "%s | Obligacje Calculator"
  },
  description: "The most accurate simulator for Polish Treasury Bonds (EDO, COI, ROR, etc.). Calculate real profit after tax and inflation.",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://obligacje-calculator.vercel.app", 
    siteName: "Obligacje Calculator",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Obligacje Calculator"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Obligacje Calculator",
    description: "Polish Treasury Bonds Simulator",
    images: ["/og-image.png"]
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dataFreshness = await getGlobalDataFreshness();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "name": "Obligacje Calculator",
        "description": "Professional simulator for Polish Treasury Bonds.",
        "url": "https://obligacje-calculator.vercel.app",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "All",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "PLN"
        },
        "potentialAction": {
          "@type": "CalculateAction",
          "name": "Calculate Bond Profit",
          "target": "https://obligacje-calculator.vercel.app/single-calculator"
        }
      },
      {
        "@type": "FinancialProduct",
        "name": "Polish Treasury Bonds",
        "description": "EDO, COI, ROR, DOR, TOS, OTS bonds simulation.",
        "provider": {
          "@type": "GovernmentOrganization",
          "name": "Ministerstwo Finansów"
        }
      }
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased bg-background text-foreground`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LanguageProvider>
          <TooltipProvider>
            <ErrorBoundary>
              <div className="flex min-h-screen">
                <Sidebar dataFreshness={dataFreshness} />
                <OpportunisticSyncTrigger />
                <main className="flex-1 lg:pl-72 flex flex-col min-h-screen overflow-x-hidden border-l">
                  <div className="flex-1 p-4 md:p-8">
                    <div className="container mx-auto max-w-7xl">
                      {children}
                    </div>
                  </div>
                  
                  <footer className="border-t py-8 mt-auto bg-muted/50">
                    <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                      <p>© {new Date().getFullYear()} Obligacje Calculator. For educational purposes only.</p>
                      <div className="flex justify-center gap-4 mt-4">
                        <a 
                          href="https://www.obligacjeskarbowe.pl/" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:underline text-primary"
                        >
                          Official Polish Bonds Website
                        </a>
                      </div>
                    </div>
                  </footer>
                </main>
              </div>
            </ErrorBoundary>
          </TooltipProvider>
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
