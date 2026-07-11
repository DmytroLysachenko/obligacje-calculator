import { execFileSync, execSync } from 'node:child_process';

interface VerifyOptions {
  baseUrl: string;
  identityToken?: string;
  allowMissingOauth: boolean;
  expectedImage?: string;
  project: string;
  region: string;
  service: string;
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

interface FetchResult {
  status: number;
  ok: boolean;
  body: string;
  contentType: string;
}

const DEFAULT_BASE_URL = 'https://obligacje-calculator-ji72nqwtea-lm.a.run.app';
const DEFAULT_PROJECT_ID = 'bond-calculator-pl';
const DEFAULT_REGION = 'europe-central2';
const DEFAULT_SERVICE = 'obligacje-calculator';
const BODY_SNIPPET_LENGTH = 240;

function parseArgs(argv: string[]): VerifyOptions {
  const options: VerifyOptions = {
    baseUrl: process.env.PROD_BASE_URL ?? DEFAULT_BASE_URL,
    identityToken: process.env.IDENTITY_TOKEN,
    allowMissingOauth: process.env.ALLOW_MISSING_OAUTH === 'true',
    expectedImage: process.env.EXPECTED_IMAGE,
    project: process.env.GCP_PROJECT_ID ?? DEFAULT_PROJECT_ID,
    region: process.env.GCP_REGION ?? DEFAULT_REGION,
    service: process.env.CLOUD_RUN_SERVICE ?? DEFAULT_SERVICE,
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
      continue;
    }

    if (arg === '--expected-image' && next) {
      options.expectedImage = next;
      index += 1;
      continue;
    }

    if (arg === '--project' && next) {
      options.project = next;
      index += 1;
      continue;
    }

    if (arg === '--region' && next) {
      options.region = next;
      index += 1;
      continue;
    }

    if (arg === '--service' && next) {
      options.service = next;
      index += 1;
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

function runGcloud(args: string[]) {
  if (process.platform === 'win32') {
    return execSync(`gcloud ${args.join(' ')}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  }

  return execFileSync('gcloud', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function verifyExpectedImage(options: VerifyOptions) {
  if (!options.expectedImage) {
    return;
  }

  const deployedImage = runGcloud([
    'run',
    'services',
    'describe',
    options.service,
    '--project',
    options.project,
    '--region',
    options.region,
    '--format=value(spec.template.spec.containers[0].image)',
  ]);

  assertOk(
    deployedImage === options.expectedImage,
    `Cloud Run image mismatch: expected ${options.expectedImage}, found ${deployedImage}`,
  );

  console.log(`Cloud Run image ok: ${deployedImage}`);
}

async function fetchPath(options: VerifyOptions, path: string): Promise<FetchResult> {
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
    contentType: response.headers.get('content-type') ?? '',
  };
}

function createResponseSummary(label: string, path: string, response: FetchResult) {
  const snippet = response.body.replace(/\s+/g, ' ').slice(0, BODY_SNIPPET_LENGTH);

  return `${label} failed at ${path}: status=${response.status} contentType=${response.contentType} body="${snippet}"`;
}

function assertOk(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseJson<T>(label: string, path: string, response: FetchResult): T {
  try {
    return JSON.parse(response.body) as T;
  } catch {
    throw new Error(createResponseSummary(`${label} JSON parse`, path, response));
  }
}

function verifyHtmlResponse(label: string, path: string, response: FetchResult) {
  assertOk(response.ok, createResponseSummary(label, path, response));
  assertOk(
    response.contentType.includes('text/html'),
    `${label} returned non-HTML contentType=${response.contentType}`,
  );
  assertOk(
    response.body.includes('<!DOCTYPE html>') || response.body.includes('__next'),
    `${label} returned HTML without the expected Next.js document markers`,
  );
  console.log(`${label} ok`);
}

function verifyJsonResponse(label: string, path: string, response: FetchResult) {
  assertOk(response.ok, createResponseSummary(label, path, response));
  assertOk(
    response.contentType.includes('application/json'),
    `${label} returned non-JSON contentType=${response.contentType}`,
  );
  parseJson<unknown>(label, path, response);
  console.log(`${label} ok`);
}

async function verifyReadiness(options: VerifyOptions) {
  const path = '/api/readiness';
  const readiness = await fetchPath(options, path);
  const payload = parseJson<ReadinessResponse>('readiness', path, readiness);

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
    createResponseSummary('readiness failed unexpectedly', path, readiness),
  );

  console.log('readiness degraded: OAuth provider intentionally missing; database ok');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  options.identityToken ??= getIdentityToken();

  assertOk(Boolean(options.identityToken), 'Missing identity token. Run gcloud auth login first.');

  const smokeChecks: Array<{
    path: string;
    label: string;
    kind: 'html' | 'json';
  }> = [
    { path: '/api/health', label: 'health', kind: 'json' },
    { path: '/', label: 'home', kind: 'html' },
    { path: '/single-calculator', label: 'single calculator', kind: 'html' },
    { path: '/api/calculation-defaults', label: 'calculation defaults', kind: 'json' },
  ];

  for (const check of smokeChecks) {
    const response = await fetchPath(options, check.path);
    assertOk(response.body.length > 0, `${check.label} returned an empty body`);

    if (check.kind === 'html') {
      verifyHtmlResponse(check.label, check.path, response);
    } else {
      verifyJsonResponse(check.label, check.path, response);
    }
  }

  await verifyReadiness(options);
  verifyExpectedImage(options);
  console.log(`Production verification passed for ${options.baseUrl}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
