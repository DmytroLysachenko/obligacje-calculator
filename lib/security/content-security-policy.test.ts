import { describe, expect, it } from 'vitest';

import { createContentSecurityPolicy, permissionsPolicy } from './content-security-policy';

describe('content security policy', () => {
  it('restricts production scripts to the request nonce and same origin', () => {
    const policy = createContentSecurityPolicy('request-nonce');

    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("script-src 'self' 'nonce-request-nonce'");
    expect(policy).not.toContain("script-src 'self' 'nonce-request-nonce' 'unsafe-eval'");
    expect(policy).toContain("style-src 'self' 'nonce-request-nonce'");
    expect(policy).toContain("style-src-elem 'self' 'nonce-request-nonce'");
    expect(policy).toContain("style-src-attr 'unsafe-inline'");
    expect(policy).not.toContain("style-src 'self' 'nonce-request-nonce' 'unsafe-inline'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'self'");
    expect(policy).toContain("worker-src 'self'");
  });

  it('permits development tooling without weakening the production policy', () => {
    expect(createContentSecurityPolicy('dev-nonce', true)).toContain("'unsafe-eval'");
    expect(createContentSecurityPolicy('prod-nonce', false)).not.toContain("'unsafe-eval'");
  });

  it('disables browser capabilities the application does not use', () => {
    expect(permissionsPolicy).toContain('camera=()');
    expect(permissionsPolicy).toContain('geolocation=()');
    expect(permissionsPolicy).toContain('microphone=()');
    expect(permissionsPolicy).toContain('payment=()');
  });
});
