import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { LanguageProvider } from "@/i18n";
import { Sidebar } from "@/shared/components/Sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { ThemeProvider } from "@/components/ThemeProvider";
import Script from "next/script";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Obligacje Skarbowe Calculator",
  description: "Advanced simulator for Polish Treasury Bonds",
  manifest: "/manifest.json"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            <TooltipProvider>
              <ErrorBoundary>
                <div className="flex min-h-screen">
                  <Sidebar />
                  <main className="flex-1 lg:pl-72 flex flex-col min-h-screen overflow-x-hidden">
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
        </ThemeProvider>
        
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
