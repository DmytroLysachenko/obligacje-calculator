'use client';

import { NextIntlClientProvider } from 'next-intl';
import type { ComponentProps } from 'react';

import { AppLocaleProvider } from '@/i18n/client';
import { appTimeZone } from '@/i18n/config';
import { ErrorBoundary } from '@/shared/components/feedback/ErrorBoundary';
import { ThemeProvider } from '@/shared/context/ThemeContext';

type ClientAppProvidersProps = ComponentProps<typeof NextIntlClientProvider>;

/** Owns client-only providers while the root layout remains server-oriented. */
export function ClientAppProviders({ children, ...intlProps }: ClientAppProvidersProps) {
  return (
    <NextIntlClientProvider {...intlProps} timeZone={appTimeZone}>
      <AppLocaleProvider>
        <ThemeProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </ThemeProvider>
      </AppLocaleProvider>
    </NextIntlClientProvider>
  );
}
