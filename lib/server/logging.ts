export interface ServerLogger {
  info(message: string, details?: unknown): void;
  warn(message: string, details?: unknown): void;
  error(message: string, details?: unknown): void;
}

class ConsoleServerLogger implements ServerLogger {
  constructor(private readonly scope: string) {}

  info(message: string, details?: unknown) {
    if (details === undefined) {
      console.info(`[${this.scope}] ${message}`);
      return;
    }

    console.info(`[${this.scope}] ${message}`, details);
  }

  warn(message: string, details?: unknown) {
    if (details === undefined) {
      console.warn(`[${this.scope}] ${message}`);
      return;
    }

    console.warn(`[${this.scope}] ${message}`, details);
  }

  error(message: string, details?: unknown) {
    if (details === undefined) {
      console.error(`[${this.scope}] ${message}`);
      return;
    }

    console.error(`[${this.scope}] ${message}`, details);
  }
}

export function createServerLogger(scope: string): ServerLogger {
  return new ConsoleServerLogger(scope);
}
