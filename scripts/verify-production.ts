import { execFileSync, execSync } from 'node:child_process';

interface VerifyOptions {
  baseUrl: string;
  identityToken?: string;
  allowMissingOauth: boolean;
}

interface ReadinessResponse {
  ok: boolean;
  checks?: {
    env?: {
      status?: string;
      detail?: string;
    };
    database?: {
      status?: string;
      detail?: string;
    };
  };
}

const DEFAULT_BASE_URL = 'https://obligacje-calculator-ji72nqwtea-lm.a.run.app';

function parseArgs(argv: string[]): VerifyOptions {
  const options: VerifyOptions = {
    baseUrl: process.env.PROD_BASE_URL ?? DEFAULT_BASE_URL,
    identityToken: process.env.IDENTITY_TOKEN,
    allowMissingOauth: process.env.ALLOW_MISSING_OAUTH === 'true',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--base-url' && next) {
      options.baseUrl = next;
      index += 1;
      continue;
    }

    if (arg === '--identity-token' && next) {
      options.identityToken = next;
      index += 1;
      continue;
    }

    if (arg === '--allow-missing-oauth') {
      options.allowMissingOauth = true;
    }
  }

  return {
    ...options,
    baseUrl: options.baseUrl.replace(/\/$/, ''),
  };
}

function getIdentityToken() {
  try {
    if (process.platform === 'win32') {
      return execSync('gcloud auth print-identity-token', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim();
    }

    return execFileSync('gcloud', ['auth', 'print-identity-token'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return undefined;
  }
}

async function fetchPath(options: VerifyOptions, path: string) {
  const response = await fetch(`${options.baseUrl}${path}`, {
    headers: options.identityToken
      ? {
          Authorization: `Bearer ${options.identityToken}`,
        }
      : undefined,
  });
  const body = await response.text();

  return {
    status: response.status,
    ok: response.ok,
    body,
  };
}

function assertOk(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function verifyReadiness(options: VerifyOptions) {
  const readiness = await fetchPath(options, '/api/readiness');
  const payload = JSON.parse(readiness.body) as ReadinessResponse;

  if (readiness.ok && payload.ok) {
    console.log('readiness ok');
    return;
  }

  const databaseStatus = payload.checks?.database?.status;
  const envDetail = payload.checks?.env?.detail ?? '';
  const onlyOauthMissing =
    options.allowMissingOauth &&
    databaseStatus === 'ok' &&
    envDetail === 'Missing required runtime configuration: OAUTH_PROVIDER';

  assertOk(
    onlyOauthMissing,
    `readiness failed unexpectedly: status=${readiness.status} body=${readiness.body}`,
  );

  console.log('readiness degraded: OAuth provider intentionally missing; database ok');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  options.identityToken ??= getIdentityToken();

  assertOk(Boolean(options.identityToken), 'Missing identity token. Run gcloud auth login first.');

  const smokeChecks = [
    { path: '/api/health', label: 'health' },
    { path: '/', label: 'home' },
    { path: '/single-calculator', label: 'single calculator' },
    { path: '/api/calculation-defaults', label: 'calculation defaults' },
  ];

  for (const check of smokeChecks) {
    const response = await fetchPath(options, check.path);
    assertOk(response.ok, `${check.label} failed: status=${response.status}`);
    assertOk(response.body.length > 0, `${check.label} returned an empty body`);
    console.log(`${check.label} ok`);
  }

  await verifyReadiness(options);
  console.log(`Production verification passed for ${options.baseUrl}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
