import { describe, expect, it } from 'vitest';

import {
  createContentSecurityPolicy,
  hasCspSource,
  parseContentSecurityPolicy,
  permissionsPolicy,
  supportsRuntimePresentationStyles,
} from './content-security-policy';

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

  it('keeps element styles nonce protected while allowing runtime positioning attributes', () => {
    const policy = createContentSecurityPolicy('browser-check');
    const directives = parseContentSecurityPolicy(policy);

    expect(directives['style-src']).toEqual(["'self'", "'nonce-browser-check'"]);
    expect(directives['style-src-elem']).toEqual(["'self'", "'nonce-browser-check'"]);
    expect(directives['style-src-attr']).toEqual(["'unsafe-inline'"]);
    expect(supportsRuntimePresentationStyles(policy)).toBe(true);
  });

  it('does not report runtime style support for a broadly weakened style source', () => {
    const policy = [
      "style-src 'self' 'nonce-browser-check' 'unsafe-inline'",
      "style-src-elem 'self' 'nonce-browser-check'",
      "style-src-attr 'unsafe-inline'",
    ].join('; ');

    expect(supportsRuntimePresentationStyles(policy)).toBe(false);
  });

  it('parses individual directives without accidentally matching prefixes', () => {
    const directives = parseContentSecurityPolicy(
      "script-src 'self'; script-src-elem 'none'; style-src-attr 'unsafe-inline'",
    );

    expect(hasCspSource(directives, 'script-src', "'self'")).toBe(true);
    expect(hasCspSource(directives, 'script-src-elem', "'self'")).toBe(false);
    expect(hasCspSource(directives, 'style-src', "'unsafe-inline'")).toBe(false);
    expect(hasCspSource(directives, 'style-src-attr', "'unsafe-inline'")).toBe(true);
  });

  it('disables browser capabilities the application does not use', () => {
    expect(permissionsPolicy).toContain('camera=()');
    expect(permissionsPolicy).toContain('geolocation=()');
    expect(permissionsPolicy).toContain('microphone=()');
    expect(permissionsPolicy).toContain('payment=()');
  });
});
