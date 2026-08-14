import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { buildRouteBundleReport } from './route-bundle-report';

const directories: string[] = [];

function fixture(): string {
  const directory = mkdtempSync(join(tmpdir(), 'route-bundle-report-'));
  directories.push(directory);
  mkdirSync(join(directory, 'static', 'chunks'), { recursive: true });
  writeFileSync(
    join(directory, 'build-manifest.json'),
    JSON.stringify({ pages: { '/compare': ['/_next/static/chunks/compare.js'], '/': [] } }),
  );
  writeFileSync(join(directory, 'static', 'chunks', 'compare.js'), 'bundle');
  return directory;
}

afterEach(() =>
  directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true })),
);

describe('buildRouteBundleReport', () => {
  it('reports sorted routes and the corresponding emitted asset sizes', () => {
    expect(buildRouteBundleReport(fixture())).toEqual([
      { route: '/', files: [], bytes: 0 },
      { route: '/compare', files: ['/_next/static/chunks/compare.js'], bytes: 6 },
    ]);
  });

  it('uses App Router client manifests when Turbopack does not list page chunks centrally', () => {
    const directory = fixture();
    const routeDirectory = join(directory, 'server', 'app', 'compare');
    mkdirSync(routeDirectory, { recursive: true });
    writeFileSync(
      join(routeDirectory, 'page_client-reference-manifest.js'),
      'globalThis.__RSC_MANIFEST["/compare/page"]={"clientModules":{"x":{"chunks":["/_next/static/chunks/compare.js"]}}};',
    );
    const apiDirectory = join(directory, 'server', 'app', 'api', 'calculate');
    mkdirSync(apiDirectory, { recursive: true });
    writeFileSync(
      join(apiDirectory, 'route_client-reference-manifest.js'),
      'globalThis.__RSC_MANIFEST["/api/calculate/route"]={"clientModules":{"x":{"chunks":["/_next/static/chunks/compare.js"]}}};',
    );

    expect(buildRouteBundleReport(directory)).toEqual([
      { route: '/compare', files: ['/_next/static/chunks/compare.js'], bytes: 6 },
    ]);
  });
});
