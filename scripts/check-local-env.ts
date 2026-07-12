import { spawnSync } from 'node:child_process';
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
