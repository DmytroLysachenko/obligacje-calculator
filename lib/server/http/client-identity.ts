import type { NextRequest } from 'next/server';

const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const IPV6 = /^[0-9a-f:]+$/i;

/**
 * Forwarded headers are meaningful only when the deployment explicitly
 * declares a trusted proxy. Otherwise untrusted callers cannot select their
 * own rate-limit bucket through a spoofed header.
 */
export function getClientIdentity(
  request: NextRequest,
  { trustedProxy = process.env.TRUSTED_PROXY === '1' }: { trustedProxy?: boolean } = {},
) {
  const candidate = trustedProxy
    ? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip')
    : request.headers.get('x-real-ip');

  return candidate && (IPV4.test(candidate) || IPV6.test(candidate)) ? candidate : 'unknown';
}
