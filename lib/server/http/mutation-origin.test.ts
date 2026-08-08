import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { isTrustedMutationOrigin, requiresOriginCheck } from './mutation-origin';

function request(headers: HeadersInit = {}, method = 'POST') {
  return new NextRequest('https://app.example.test/api/portfolio', { headers, method });
}

describe('cookie mutation origin policy', () => {
  it('accepts matching same-origin browser mutations', () => {
    expect(
      isTrustedMutationOrigin(
        request({ Origin: 'https://app.example.test', 'Sec-Fetch-Site': 'same-origin' }),
      ),
    ).toBe(true);
  });

  it('rejects cross-site fetches before considering a forged Origin', () => {
    expect(
      isTrustedMutationOrigin(
        request({ Origin: 'https://app.example.test', 'Sec-Fetch-Site': 'cross-site' }),
      ),
    ).toBe(false);
  });

  it('rejects sibling, foreign, malformed, and opaque browser origins', () => {
    for (const headers of [
      { Origin: 'https://admin.example.test', 'Sec-Fetch-Site': 'same-site' },
      { Origin: 'https://attacker.test', 'Sec-Fetch-Site': 'cross-site' },
      { Origin: 'not a URL', 'Sec-Fetch-Site': 'same-origin' },
      { Origin: 'null', 'Sec-Fetch-Site': 'none' },
    ]) {
      expect(isTrustedMutationOrigin(request(headers))).toBe(false);
    }
  });

  it('permits only non-browser or same-origin requests when Origin is absent', () => {
    expect(isTrustedMutationOrigin(request())).toBe(true);
    expect(isTrustedMutationOrigin(request({ 'Sec-Fetch-Site': 'same-origin' }))).toBe(true);
    expect(isTrustedMutationOrigin(request({ 'Sec-Fetch-Site': 'same-site' }))).toBe(false);
    expect(isTrustedMutationOrigin(request({ 'Sec-Fetch-Site': 'cross-site' }))).toBe(false);
  });

  it('requires checks only for state-changing methods', () => {
    for (const method of ['GET', 'HEAD', 'OPTIONS'])
      expect(requiresOriginCheck(method)).toBe(false);
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE'])
      expect(requiresOriginCheck(method)).toBe(true);
  });
});
