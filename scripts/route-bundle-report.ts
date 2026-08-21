import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

interface BuildManifest {
  pages: Record<string, string[]>;
}

interface RouteBundle {
  route: string;
  files: string[];
  bytes: number;
}

function appClientManifestPaths(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return appClientManifestPaths(path);
    return entry.name.endsWith('_client-reference-manifest.js') ? [path] : [];
  });
}

function appRouteFromManifestPath(path: string): string {
  const relative =
    path.split('/server/app/')[1]?.replace(/_client-reference-manifest\.js$/, '') ?? '';
  const route = relative.replace(/\/page$/, '').replace(/\/\[([^\]]+)\]/g, '/:$1');
  return route ? `/${route}` : '/';
}

function chunksFromClientManifest(path: string): string[] {
  const source = readFileSync(path, 'utf8');
  return [...source.matchAll(/"chunks":(\[[^\]]*\])/g)].flatMap((match) => {
    try {
      return JSON.parse(match[1]) as string[];
    } catch {
      return [];
    }
  });
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function staticFileSize(nextDirectory: string, asset: string): number {
  const path = resolve(nextDirectory, asset.replace(/^\/_next\//, ''));
  return existsSync(path) ? statSync(path).size : 0;
}

/**
 * Produces a deterministic, route-level inventory from a completed Next build.
 * It is an evidence aid: compressed transfer sizes remain a browser-measurement
 * concern, while this report makes uncompressed bundle ownership reviewable.
 */
export function buildRouteBundleReport(nextDirectory = '.next'): RouteBundle[] {
  const manifestPath = resolve(nextDirectory, 'build-manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`No Next build manifest at ${manifestPath}. Run pnpm build first.`);
  }

  const appRoutes = appClientManifestPaths(resolve(nextDirectory, 'server', 'app'))
    .map((path) => ({
      route: appRouteFromManifestPath(path),
      files: [...new Set(chunksFromClientManifest(path))].sort(),
    }))
    .filter(({ route }) => !route.startsWith('/api/'));
  const manifest = readJson<BuildManifest>(manifestPath);
  const routes =
    appRoutes.length > 0
      ? appRoutes
      : Object.entries(manifest.pages).map(([route, files]) => ({ route, files }));

  return routes
    .map(({ route, files }) => ({
      route,
      files: [...files].sort(),
      bytes: files.reduce((total, file) => total + staticFileSize(nextDirectory, file), 0),
    }))
    .sort((left, right) => left.route.localeCompare(right.route));
}

export function writeRouteBundleReport(
  outputPath = 'artifacts/route-bundle-report.json',
  nextDirectory = '.next',
): RouteBundle[] {
  const report = buildRouteBundleReport(nextDirectory);
  const resolvedOutputPath = resolve(outputPath);
  mkdirSync(dirname(resolvedOutputPath), { recursive: true });
  writeFileSync(resolvedOutputPath, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

if (process.argv[1]?.endsWith('route-bundle-report.ts')) {
  const outputPath = process.argv[2] ?? 'artifacts/route-bundle-report.json';
  const report = writeRouteBundleReport(outputPath);
  process.stdout.write(`Wrote ${report.length} route bundle records to ${outputPath}\n`);
}
