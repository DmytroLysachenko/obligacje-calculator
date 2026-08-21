import { readFileSync, rmSync } from 'node:fs';

import { findActionableServerDiagnostics } from './server-diagnostics';

const stderrFile = process.env.PLAYWRIGHT_SERVER_STDERR_FILE ?? '.playwright-server.stderr';

export default function globalTeardown() {
  let output = '';
  try {
    output = readFileSync(stderrFile, 'utf8');
  } catch {
    return;
  } finally {
    rmSync(stderrFile, { force: true });
  }

  const diagnostics = findActionableServerDiagnostics(output);
  if (diagnostics.length > 0) {
    throw new Error(`Unexpected Auth.js server diagnostics:\n${diagnostics.join('\n')}`);
  }
}
