'use client';

import { useEffect } from 'react';

import { shouldReportWebVital } from '@/shared/lib/telemetry-controls';

type VitalName = 'CLS' | 'INP' | 'LCP';

interface VitalPayload {
  name: VitalName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  path: string;
  navigationType: string;
}

function send(payload: Omit<VitalPayload, 'path' | 'navigationType'>) {
  const navigation = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;
  const body = JSON.stringify({
    ...payload,
    path: window.location.pathname,
    navigationType: navigation?.type ?? 'navigate',
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      '/api/observability/vitals',
      new Blob([body], { type: 'application/json' }),
    );
    return;
  }

  void fetch('/api/observability/vitals', {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/json' },
    keepalive: true,
  });
}

export function WebVitalsReporter() {
  useEffect(() => {
    const privacyNavigator = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (!shouldReportWebVital({
      doNotTrack: navigator.doNotTrack,
      globalPrivacyControl: privacyNavigator.globalPrivacyControl,
    })) {
      return;
    }

    void import('web-vitals').then(({ onCLS, onINP, onLCP }) => {
      onCLS(send);
      onINP(send);
      onLCP(send);
    });
  }, []);

  return null;
}
