'use client';

interface PersistedEnvelope<T> {
  version: 1;
  updatedAt: string;
  state: T;
}

export function loadPersistedCalculatorState<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedEnvelope<T> | T;
    if (parsed && typeof parsed === 'object' && 'state' in parsed) {
      return (parsed as PersistedEnvelope<T>).state;
    }

    return parsed as T;
  } catch {
    return null;
  }
}

export function savePersistedCalculatorState<T>(key: string, state: T) {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: PersistedEnvelope<T> = {
    version: 1,
    updatedAt: new Date().toISOString(),
    state,
  };

  window.localStorage.setItem(key, JSON.stringify(payload));
}
