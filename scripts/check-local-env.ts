import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

type Status = 'pass' | 'warn' | 'fail';

type Check = {
  label: string;
  status: Status;
  detail: string;
  hint?: string;
};

export type LocalEnvOptions = {
  requirePlaywright: boolean;
};

export function parseOptions(argv: string[]): LocalEnvOptions {
  return {
    requirePlaywright: argv.includes('--require-playwright'),
  };
}

function run(command: string, args: string[] = []) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();

  return {
    ok: result.status === 0,
    output,
  };
}

function commandVersion(label: string, command: string, args: string[] = ['--version']): Check {
  const result = run(command, args);

  return {
    label,
    status: result.ok ? 'pass' : 'fail',
    detail: result.ok ? result.output.split('\n')[0] : `${command} is not available`,
    hint: result.ok ? undefined : `Install ${command} and make sure it is on PATH.`,
  };
}

function optionalCommand(label: string, command: string, args: string[], hint: string): Check {
  const result = run(command, args);

  return {
    label,
    status: result.ok ? 'pass' : 'warn',
    detail: result.ok ? result.output.split('\n')[0] : result.output || `${command} is not ready`,
    hint: result.ok ? undefined : hint,
  };
}

function gitWorktreeCheck(): Check {
  const result = run('git', ['rev-parse', '--is-inside-work-tree']);

  return {
    label: 'git worktree',
    status: result.ok && result.output === 'true' ? 'pass' : 'fail',
    detail: result.ok ? 'inside a git worktree' : result.output || 'not a git worktree',
    hint: result.ok ? undefined : 'Run this from the project repository.',
  };
}

function playwrightCheck(options: LocalEnvOptions): Check {
  const result = run('pnpm', ['exec', 'playwright', '--version']);

  return {
    label: 'Playwright',
    status: result.ok ? 'pass' : options.requirePlaywright ? 'fail' : 'warn',
    detail: result.ok ? result.output : result.output || 'Playwright is not available',
    hint: result.ok ? undefined : 'Run pnpm install and pnpm exec playwright install chromium.',
  };
}

function findChromiumShell() {
  const cacheRoot = join(homedir(), '.cache', 'ms-playwright');

  if (!existsSync(cacheRoot)) {
    return undefined;
  }

  return readdirSync(cacheRoot)
    .filter((entry) => entry.startsWith('chromium_headless_shell-'))
    .map((entry) =>
      join(cacheRoot, entry, 'chrome-headless-shell-linux64', 'chrome-headless-shell'),
    )
    .find((executable) => existsSync(executable));
}

function chromiumLibrariesCheck(options: LocalEnvOptions): Check {
  if (process.platform !== 'linux') {
    return {
      label: 'Chromium shared libraries',
      status: 'pass',
      detail: 'not required on this platform',
    };
  }

  const executable = findChromiumShell();

  if (!executable) {
    return {
      label: 'Chromium shared libraries',
      status: options.requirePlaywright ? 'fail' : 'warn',
      detail: 'Playwright Chromium executable is not installed',
      hint: 'Run pnpm exec playwright install chromium.',
    };
  }

  const result = run('ldd', [executable]);
  const missing = result.output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('not found'));

  return {
    label: 'Chromium shared libraries',
    status: missing.length === 0 ? 'pass' : options.requirePlaywright ? 'fail' : 'warn',
    detail: missing.length === 0 ? 'all linked libraries resolved' : missing.join('; '),
    hint:
      missing.length === 0
        ? undefined
        : 'Run pnpm exec playwright install-deps chromium, or install the missing packages through apt.',
  };
}

export function createChecks(options: LocalEnvOptions): Check[] {
  return [
    {
      label: 'Node.js',
      status: 'pass',
      detail: process.version,
    },
    commandVersion('pnpm', 'pnpm', ['--version']),
    gitWorktreeCheck(),
    playwrightCheck(options),
    chromiumLibrariesCheck(options),
    optionalCommand(
      'Docker daemon',
      'docker',
      ['info', '--format', '{{.ServerVersion}}'],
      'Start Docker Desktop with WSL integration enabled.',
    ),
    optionalCommand(
      'Docker Compose',
      'docker',
      ['compose', 'version'],
      'Install Docker Compose v2.',
    ),
    optionalCommand(
      'gcloud auth',
      'gcloud',
      ['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)'],
      'Run gcloud auth login and gcloud config set project bond-calculator-pl.',
    ),
    optionalCommand(
      'GitHub CLI auth',
      'gh',
      ['auth', 'status'],
      'Run gh auth login if you want CLI access to GitHub operations.',
    ),
  ];
}

function printCheck(check: Check) {
  const icon = check.status === 'pass' ? '[ok]' : check.status === 'warn' ? '[warn]' : '[fail]';
  console.log(`${icon} ${check.label}: ${check.detail}`);

  if (check.hint) {
    console.log(`      ${check.hint}`);
  }
}

export function main(argv = process.argv.slice(2)) {
  const checks = createChecks(parseOptions(argv));

  for (const check of checks) {
    printCheck(check);
  }

  if (checks.some((check) => check.status === 'fail')) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
