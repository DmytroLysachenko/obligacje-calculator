import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const isWindows = process.platform === 'win32';
const knipBinary = isWindows ? 'knip.CMD' : 'knip';
const knipPath = join(process.cwd(), 'node_modules', '.bin', knipBinary);
const args = ['--no-progress', '--no-exit-code', ...process.argv.slice(2)];

const result = spawnSync(knipPath, args, {
  stdio: 'inherit',
  shell: isWindows,
  env: {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL ?? 'postgres://unused:unused@localhost:5432/unused',
  },
});

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);
