import { afterEach, describe, expect, it, vi } from 'vitest';

import { createServerLogger } from './logging';

describe('server logging', () => {
  afterEach(() => vi.restoreAllMocks());

  it('does not emit raw Error messages that can contain request or database values', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const attackerValue = 'x'.repeat(4_096);

    createServerLogger('Test').error(
      'database command failed',
      new Error(`query failed: ${attackerValue}`),
    );

    expect(error).toHaveBeenCalledWith('[Test] database command failed', { errorType: 'Error' });
    expect(JSON.stringify(error.mock.calls)).not.toContain(attackerValue);
  });

  it('redacts sensitive fields and caps ordinary string details', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    createServerLogger('Test').warn('provider failed', {
      authorization: 'Bearer never-log-me',
      detail: 'x'.repeat(1_000),
    });

    expect(warn).toHaveBeenCalledWith('[Test] provider failed', {
      authorization: '[redacted]',
      detail: expect.stringContaining('[truncated]'),
    });
    expect(JSON.stringify(warn.mock.calls)).not.toContain('never-log-me');
  });
});
