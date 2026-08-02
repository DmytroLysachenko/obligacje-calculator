import { NextRequest } from 'next/server';

/**
 * Cookie-authenticated APIs are same-origin only.  This deliberately keeps
 * CORS closed: a future trusted cross-origin client must use CSRF tokens and a
 * separately reviewed policy instead of relaxing this check.
 */
export function isTrustedMutationOrigin(request: NextRequest): boolean {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site') return false;

  const origin = request.headers.get('origin');
  if (!origin) return true; // non-browser clients are authenticated separately.

  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

export function requiresOriginCheck(method: string): boolean {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}
