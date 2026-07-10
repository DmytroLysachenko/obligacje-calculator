const DEFAULT_BASE_URL = 'http://localhost:3000';
const REQUIRED_ROUTES = ['/', '/single-calculator', '/api/health', '/api/calculation-defaults'];

function readBaseUrl() {
  const baseUrlFlag = process.argv.find((arg) => arg.startsWith('--base-url='));

  if (baseUrlFlag) {
    return baseUrlFlag.slice('--base-url='.length);
  }

  const baseUrlFlagIndex = process.argv.indexOf('--base-url');
  if (baseUrlFlagIndex >= 0) {
    return process.argv[baseUrlFlagIndex + 1] ?? DEFAULT_BASE_URL;
  }

  return process.env.LOCAL_SMOKE_BASE_URL ?? DEFAULT_BASE_URL;
}

async function verifyRoute(baseUrl: string, route: string) {
  const response = await fetch(new URL(route, baseUrl));

  if (!response.ok) {
    throw new Error(`${route} returned ${response.status}`);
  }

  return `${route}: ${response.status}`;
}

async function main() {
  const baseUrl = readBaseUrl();
  const results = await Promise.all(REQUIRED_ROUTES.map((route) => verifyRoute(baseUrl, route)));

  for (const result of results) {
    console.log(result);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
