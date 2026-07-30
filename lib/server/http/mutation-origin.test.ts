import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { isTrustedMutationOrigin, requiresOriginCheck } from './mutation-origin';

function request(headers: HeadersInit = {}) {
  return new NextRequest('https://calculator.example/api/portfolio', { method: 'POST', headers });
}

describe('mutation origin policy', () => {
  it('accepts same-origin browser mutations', () => {
    expect(isTrustedMutationOrigin(request({ origin: 'https://calculator.example' }))).toBe(true);
  });

  it('rejects cross-site fetch metadata before inspecting the origin', () => {
    expect(
      isTrustedMutationOrigin(
        request({ origin: 'https://calculator.example', 'sec-fetch-site': 'cross-site' }),
      ),
    ).toBe(false);
  });

  it('rejects malformed and foreign origins', () => {
    expect(isTrustedMutationOrigin(request({ origin: 'not a url' }))).toBe(false);
    expect(isTrustedMutationOrigin(request({ origin: 'https://attacker.example' }))).toBe(false);
  });

  it('permits authenticated non-browser clients without Origin', () => {
    expect(isTrustedMutationOrigin(request())).toBe(true);
  });

  it.each([
    ['same-site', true],
    ['same-origin', true],
    ['none', true],
    ['cross-site', false],
  ])('handles Sec-Fetch-Site=%s without weakening the origin boundary', (fetchSite, expected) => {
    expect(
      isTrustedMutationOrigin(
        request({ origin: 'https://calculator.example', 'sec-fetch-site': fetchSite }),
      ),
    ).toBe(expected);
  });

  it('does not allow an origin with a matching hostname but a different scheme or port', () => {
    expect(isTrustedMutationOrigin(request({ origin: 'http://calculator.example' }))).toBe(false);
    expect(isTrustedMutationOrigin(request({ origin: 'https://calculator.example:444' }))).toBe(false);
  });

  it('checks only state-changing methods', () => {
    expect(requiresOriginCheck('POST')).toBe(true);
    expect(requiresOriginCheck('PATCH')).toBe(true);
    expect(requiresOriginCheck('DELETE')).toBe(true);
    expect(requiresOriginCheck('GET')).toBe(false);
    expect(requiresOriginCheck('OPTIONS')).toBe(false);
  });
});
