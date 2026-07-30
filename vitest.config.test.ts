import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('Vitest runner boundary', () => {
  const config = readFileSync('vitest.config.ts', 'utf8');

  it('keeps browser suites owned exclusively by Playwright', () => {
    expect(config).toContain("'tests/browser/**'");
    expect(config).toContain("include: ['**/*.{test,spec}.ts', '**/*.{test,spec}.tsx']");
  });

  it('keeps brittle source-shape contracts out of the default behavioral suite', () => {
    expect(config).toContain("'**/*.contract.test.{ts,tsx}'");
    expect(config).toContain("'**/*contract.test.{ts,tsx}'");
    expect(config).toContain("'**/*-style.test.{ts,tsx}'");
    expect(config).toContain("'**/*-layout.test.{ts,tsx}'");
    expect(config).toContain("'**/*-boundary.test.{ts,tsx}'");
  });

  it('measures critical decision code without counting source-shape contracts', () => {
    expect(config).toContain("provider: 'v8'");
    expect(config).toContain("'features/bond-core/**'");
    expect(config).toContain("'lib/server/**'");
    expect(config).toContain("'**/*.contract.test.{ts,tsx}'");
  });

  it('keeps generated browser output outside the unit-test discovery surface', () => {
    expect(config).toContain("'playwright-report/**'");
    expect(config).toContain("'test-results/**'");
    expect(config).toContain("'node_modules/**'");
  });

  it('keeps the test environment explicit for deterministic component tests', () => {
    expect(config).toContain("environment: 'jsdom'");
    expect(config).toContain('testTimeout: 15_000');
    expect(config).toContain("reporter: ['text', 'json-summary']");
  });
});
