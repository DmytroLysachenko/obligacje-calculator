export interface ServerLogger {
  info(message: string, details?: unknown): void;
  warn(message: string, details?: unknown): void;
  error(message: string, details?: unknown): void;
}

const MAX_LOG_STRING_LENGTH = 512;
const MAX_LOG_COLLECTION_LENGTH = 20;
const SENSITIVE_KEY = /(?:authorization|cookie|secret|token|password|api[-_]?key|credential)/i;

function truncate(value: string) {
  return value.length > MAX_LOG_STRING_LENGTH
    ? `${value.slice(0, MAX_LOG_STRING_LENGTH)}…[truncated]`
    : value;
}

function sanitizeDetails(value: unknown, depth = 0): unknown {
  if (value instanceof Error) {
    // Database/provider errors can include request values or credentials in
    // generated SQL. Keep classification, never raw error text.
    return { errorType: value.name || 'Error' };
  }
  if (typeof value === 'string') return truncate(value);
  if (typeof value !== 'object' || value === null) return value;
  if (depth >= 4) return '[max-depth]';
  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_LOG_COLLECTION_LENGTH)
      .map((entry) => sanitizeDetails(entry, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .slice(0, MAX_LOG_COLLECTION_LENGTH)
      .map(([key, entry]) => [
        key,
        SENSITIVE_KEY.test(key) ? '[redacted]' : sanitizeDetails(entry, depth + 1),
      ]),
  );
}

class ConsoleServerLogger implements ServerLogger {
  constructor(private readonly scope: string) {}

  info(message: string, details?: unknown) {
    if (details === undefined) {
      console.info(`[${this.scope}] ${message}`);
      return;
    }

    console.info(`[${this.scope}] ${message}`, sanitizeDetails(details));
  }

  warn(message: string, details?: unknown) {
    if (details === undefined) {
      console.warn(`[${this.scope}] ${message}`);
      return;
    }

    console.warn(`[${this.scope}] ${message}`, sanitizeDetails(details));
  }

  error(message: string, details?: unknown) {
    if (details === undefined) {
      console.error(`[${this.scope}] ${message}`);
      return;
    }

    console.error(`[${this.scope}] ${message}`, sanitizeDetails(details));
  }
}

export function createServerLogger(scope: string): ServerLogger {
  return new ConsoleServerLogger(scope);
}
