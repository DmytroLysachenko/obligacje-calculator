const DEFAULT_BASE_URL = 'http://localhost:3000';
const REQUIRED_ROUTES = ['/', '/single-calculator', '/api/health', '/api/calculation-defaults'];

interface SmokeOptions {
  baseUrl: string;
  routes: string[];
  checkContentType: boolean;
  retries: number;
  retryDelayMs: number;
}

function readFlagValue(argv: string[], name: string) {
  const equalsFlag = argv.find((arg) => arg.startsWith(`${name}=`));

  if (equalsFlag) {
    return equalsFlag.slice(`${name}=`.length);
  }

  const flagIndex = argv.indexOf(name);
  if (flagIndex >= 0) {
    return argv[flagIndex + 1];
  }

  return undefined;
}

function readRepeatedFlagValues(argv: string[], name: string) {
  return argv.flatMap((arg, index) => {
    if (arg.startsWith(`${name}=`)) {
      return [arg.slice(`${name}=`.length)];
    }

    if (arg === name && argv[index + 1]) {
      return [argv[index + 1]];
    }

    return [];
  });
}

function parseOptions(argv = process.argv.slice(2)): SmokeOptions {
  const baseUrl =
    readFlagValue(argv, '--base-url') ?? process.env.LOCAL_SMOKE_BASE_URL ?? DEFAULT_BASE_URL;
  const extraRoutes = readRepeatedFlagValues(argv, '--route');

  return {
    baseUrl,
    routes: extraRoutes.length > 0 ? extraRoutes : REQUIRED_ROUTES,
    checkContentType: argv.includes('--check-content-type'),
    retries: Number(readFlagValue(argv, '--retries') ?? 20),
    retryDelayMs: Number(readFlagValue(argv, '--retry-delay-ms') ?? 1_000),
  };
}

function expectedContentType(route: string) {
  return route.startsWith('/api/') ? 'application/json' : 'text/html';
}

async function verifyRoute({ baseUrl, checkContentType }: SmokeOptions, route: string) {
  const response = await fetch(new URL(route, baseUrl));

  if (!response.ok) {
    throw new Error(`${route} returned ${response.status}`);
  }

  if (checkContentType) {
    const expected = expectedContentType(route);
    const actual = response.headers.get('content-type') ?? '';

    if (!actual.includes(expected)) {
      throw new Error(`${route} returned content-type "${actual}", expected "${expected}"`);
    }
  }

  return `${route}: ${response.status}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function verifyRouteWithRetries(options: SmokeOptions, route: string) {
  let lastError: unknown;

  for (let attempt = 0; attempt <= options.retries; attempt += 1) {
    try {
      return await verifyRoute(options, route);
    } catch (error) {
      lastError = error;

      if (attempt < options.retries) {
        await sleep(options.retryDelayMs);
      }
    }
  }

  throw lastError;
}

async function main() {
  const options = parseOptions();
  const results = await Promise.all(
    options.routes.map((route) => verifyRouteWithRetries(options, route)),
  );

  for (const result of results) {
    console.log(result);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
