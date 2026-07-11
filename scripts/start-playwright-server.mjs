import { spawn } from 'node:child_process';
import { cpSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const port = process.env.PORT ?? '3100';
const env = {
  ...process.env,
  HOSTNAME: process.env.HOSTNAME ?? '127.0.0.1',
  PORT: port,
  PLAYWRIGHT_SMOKE: process.env.PLAYWRIGHT_SMOKE ?? '1',
  NEXT_PUBLIC_PLAYWRIGHT_SMOKE: process.env.NEXT_PUBLIC_PLAYWRIGHT_SMOKE ?? '1',
};

const useStandalone = process.platform !== 'win32' && existsSync('.next/standalone/server.js');

if (useStandalone) {
  if (existsSync('.next/static')) {
    cpSync('.next/static', '.next/standalone/.next/static', { recursive: true });
  }

  if (existsSync('public')) {
    cpSync('public', '.next/standalone/public', { recursive: true });
  }
}
const command = process.execPath;
const args = useStandalone
  ? ['.next/standalone/server.js']
  : [require.resolve('next/dist/bin/next'), 'start', '--port', port];

const server = spawn(command, args, {
  env,
  stdio: 'inherit',
});

function forwardSignal(signal) {
  process.on(signal, () => {
    server.kill(signal);
  });
}

forwardSignal('SIGINT');
forwardSignal('SIGTERM');

server.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
