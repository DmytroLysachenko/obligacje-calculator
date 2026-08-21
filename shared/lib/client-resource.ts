'use client';

type ClientResourceStatus = 'idle' | 'loading' | 'ready' | 'stale' | 'error';

export interface ClientResourceSnapshot<T> {
  data: T | null;
  error: Error | null;
  status: ClientResourceStatus;
  updatedAt: number | null;
}

export interface ClientResourceOptions {
  maxAgeMs: number;
  staleAfterMs?: number;
}

type ResourceListener<T> = (snapshot: ClientResourceSnapshot<T>) => void;

const emptySnapshot = <T>(): ClientResourceSnapshot<T> => ({
  data: null,
  error: null,
  status: 'idle',
  updatedAt: null,
});

/**
 * Keeps a single client-side request, cache entry, and subscriber list per
 * resource. Components can render cached data while a stale refresh happens
 * without each mount issuing another request.
 */
export class ClientResource<T> {
  private snapshot = emptySnapshot<T>();
  private inFlight: Promise<T> | null = null;
  private listeners = new Set<ResourceListener<T>>();

  constructor(private readonly options: ClientResourceOptions) {}

  getSnapshot = () => this.snapshot;

  subscribe = (listener: ResourceListener<T>) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  isFresh(now = Date.now()) {
    return (
      this.snapshot.data !== null &&
      this.snapshot.updatedAt !== null &&
      now - this.snapshot.updatedAt < this.options.maxAgeMs
    );
  }

  isStale(now = Date.now()) {
    const staleAfterMs = this.options.staleAfterMs ?? this.options.maxAgeMs;
    return (
      this.snapshot.data !== null &&
      this.snapshot.updatedAt !== null &&
      now - this.snapshot.updatedAt >= staleAfterMs
    );
  }

  async load(fetcher: () => Promise<T>, options: { force?: boolean } = {}) {
    if (!options.force && this.isFresh()) {
      return this.snapshot.data as T;
    }

    if (this.inFlight) {
      return this.inFlight;
    }

    this.publish({
      ...this.snapshot,
      error: null,
      status: this.snapshot.data === null ? 'loading' : 'stale',
    });

    this.inFlight = fetcher()
      .then((data) => {
        this.publish({ data, error: null, status: 'ready', updatedAt: Date.now() });
        return data;
      })
      .catch((error: unknown) => {
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        this.publish({
          ...this.snapshot,
          error: normalizedError,
          status: this.snapshot.data === null ? 'error' : 'stale',
        });
        throw normalizedError;
      })
      .finally(() => {
        this.inFlight = null;
      });

    return this.inFlight;
  }

  invalidate() {
    if (this.snapshot.data === null) {
      return;
    }

    this.publish({ ...this.snapshot, status: 'stale' });
  }

  clear() {
    this.inFlight = null;
    this.publish(emptySnapshot<T>());
  }

  private publish(snapshot: ClientResourceSnapshot<T>) {
    this.snapshot = snapshot;
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}
