export interface SyncLogger {
  info(message: string, details?: unknown): void;
  warn(message: string, details?: unknown): void;
  error(message: string, details?: unknown): void;
}

class ConsoleSyncLogger implements SyncLogger {
  constructor(private readonly scope: string) {}

  info(message: string, details?: unknown) {
    if (details === undefined) {
      console.log(`[${this.scope}] ${message}`);
      return;
    }

    console.log(`[${this.scope}] ${message}`, details);
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

export function createSyncLogger(scope: string): SyncLogger {
  return new ConsoleSyncLogger(scope);
}
