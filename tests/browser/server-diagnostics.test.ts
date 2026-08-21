import { describe, expect, it } from 'vitest';

import { findActionableServerDiagnostics } from './server-diagnostics';

describe('Playwright server diagnostics', () => {
  it('retains Auth.js host errors while ignoring unrelated server output', () => {
    expect(
      findActionableServerDiagnostics(
        'ready\n[auth][error] UntrustedHost: invalid host\nGET / 200',
      ),
    ).toEqual(['[auth][error] UntrustedHost: invalid host']);
  });
});
