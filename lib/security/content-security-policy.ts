const baseDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
];

export type ContentSecurityPolicyDirectives = Record<string, string[]>;

/**
 * Parses the header shape browsers actually receive. Keeping this tiny parser
 * close to policy construction makes header-level regression tests possible
 * without duplicating fragile string matching in every test suite.
 */
export function parseContentSecurityPolicy(policy: string): ContentSecurityPolicyDirectives {
  return policy.split(';').reduce<ContentSecurityPolicyDirectives>((directives, segment) => {
    const [name, ...sources] = segment.trim().split(/\s+/);

    if (name) {
      directives[name] = sources;
    }

    return directives;
  }, {});
}

export function hasCspSource(
  policy: ContentSecurityPolicyDirectives,
  directive: string,
  source: string,
) {
  return policy[directive]?.includes(source) ?? false;
}

export function createContentSecurityPolicy(nonce: string, isDevelopment = false) {
  const scriptSource = isDevelopment
    ? `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`
    : `script-src 'self' 'nonce-${nonce}'`;

  // Next Fast Refresh and browser developer tools inject style elements without
  // access to the request nonce. Keep production nonce-only; the local dev
  // server may permit those transient elements so diagnostics remain usable.
  const styleElementSource = isDevelopment
    ? `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`
    : `style-src 'self' 'nonce-${nonce}'`;
  const styleElementDirective = isDevelopment
    ? `style-src-elem 'self' 'nonce-${nonce}' 'unsafe-inline'`
    : `style-src-elem 'self' 'nonce-${nonce}'`;

  // Recharts and Radix set presentation-only style attributes at runtime.
  return [
    ...baseDirectives,
    scriptSource,
    styleElementSource,
    styleElementDirective,
    "style-src-attr 'unsafe-inline'",
  ].join('; ');
}

/**
 * A deliberately narrow assertion for browser-facing presentation styles.
 * Recharts and Radix write style attributes for positioning and transforms;
 * their runtime behavior must not weaken nonce-protected style elements.
 */
export function supportsRuntimePresentationStyles(policy: string) {
  const directives = parseContentSecurityPolicy(policy);

  return (
    hasCspSource(directives, 'style-src-attr', "'unsafe-inline'") &&
    hasCspSource(directives, 'style-src-elem', "'self'") &&
    !hasCspSource(directives, 'style-src', "'unsafe-inline'")
  );
}

export const permissionsPolicy = [
  'accelerometer=()',
  'camera=()',
  'geolocation=()',
  'gyroscope=()',
  'magnetometer=()',
  'microphone=()',
  'payment=()',
  'usb=()',
].join(', ');

/**
 * Keep browsing contexts and same-origin assets isolated without enabling
 * COEP, which would block the official data sources used by the application.
 */
export const crossOriginSecurityHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
} as const;
