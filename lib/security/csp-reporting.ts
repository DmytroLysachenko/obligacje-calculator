import { z } from 'zod';

const MAX_DIRECTIVE_LENGTH = 120;
const MAX_URI_LENGTH = 512;

const CspReportSchema = z
  .object({
    'blocked-uri': z.string().max(MAX_URI_LENGTH).optional(),
    'column-number': z.number().int().nonnegative().optional(),
    'document-uri': z.string().max(MAX_URI_LENGTH).optional(),
    'effective-directive': z.string().max(MAX_DIRECTIVE_LENGTH).optional(),
    'line-number': z.number().int().nonnegative().optional(),
    'original-policy': z.string().max(4096).optional(),
    referrer: z.string().max(MAX_URI_LENGTH).optional(),
    'source-file': z.string().max(MAX_URI_LENGTH).optional(),
    'status-code': z.number().int().min(100).max(599).optional(),
    'violated-directive': z.string().max(MAX_DIRECTIVE_LENGTH).optional(),
  })
  .strict();

const CspReportEnvelopeSchema = z
  .object({
    'csp-report': CspReportSchema,
  })
  .strict();

export type SanitizedCspReport = {
  blockedOrigin: string | null;
  directive: string | null;
  documentPath: string | null;
  sourcePath: string | null;
};

function sanitizeUrl(value: string | undefined, includeOrigin: boolean) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return includeOrigin ? url.origin : url.pathname;
  } catch {
    return value === 'inline' || value === 'eval' || value === 'data' ? value : null;
  }
}

function sanitizeDirective(value: string | undefined) {
  if (!value) return null;
  return value.split(/\s+/)[0]?.slice(0, MAX_DIRECTIVE_LENGTH) ?? null;
}

/**
 * Parses only legacy CSP report envelopes and strips query strings, fragments,
 * policy text, referrers, and line details before an event reaches logs.
 */
export function parseCspReport(payload: unknown): SanitizedCspReport | null {
  const parsed = CspReportEnvelopeSchema.safeParse(payload);
  if (!parsed.success) return null;

  const report = parsed.data['csp-report'];
  return {
    blockedOrigin: sanitizeUrl(report['blocked-uri'], true),
    directive: sanitizeDirective(report['effective-directive'] ?? report['violated-directive']),
    documentPath: sanitizeUrl(report['document-uri'], false),
    sourcePath: sanitizeUrl(report['source-file'], false),
  };
}

export function shouldSampleCspReport(
  report: SanitizedCspReport,
  sampleRate = 0.1,
  random = Math.random,
) {
  if (sampleRate <= 0) return false;
  if (sampleRate >= 1) return true;

  // Always retain an unfamiliar directive; otherwise sample repetitive noise.
  if (!report.directive) return true;
  return random() < sampleRate;
}
