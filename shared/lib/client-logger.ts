'use client';

type ClientLogDetails = Record<string, unknown> | undefined;

export function logClientError(message: string, error: unknown, details?: ClientLogDetails) {
  if (details) {
    console.error(message, error, details);
    return;
  }

  console.error(message, error);
}

export function logClientWarning(message: string, details?: ClientLogDetails) {
  if (details) {
    console.warn(message, details);
    return;
  }

  console.warn(message);
}
