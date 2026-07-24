'use client';

import { useEffect } from 'react';

type VitalName = 'CLS' | 'INP' | 'LCP';

interface VitalPayload {
  name: VitalName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  path: string;
}

function send(payload: Omit<VitalPayload, 'path'>) {
  const body = JSON.stringify({ ...payload, path: window.location.pathname });

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/observability/vitals', new Blob([body], { type: 'application/json' }));
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
    void import('web-vitals').then(({ onCLS, onINP, onLCP }) => {
      onCLS(send);
      onINP(send);
      onLCP(send);
    });
  }, []);

  return null;
}
