import { NextRequest, NextResponse } from 'next/server';

import {
  createContentSecurityPolicy,
  permissionsPolicy,
} from '@/lib/security/content-security-policy';

function createNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Buffer.from(bytes).toString('base64');
}

export function proxy(request: NextRequest) {
  const nonce = createNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-csp-nonce', nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set(
    'Content-Security-Policy',
    createContentSecurityPolicy(nonce, process.env.NODE_ENV !== 'production'),
  );
  response.headers.set('Permissions-Policy', permissionsPolicy);

  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
