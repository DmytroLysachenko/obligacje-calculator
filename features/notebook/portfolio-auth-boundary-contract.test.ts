import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

const files = {
  login: 'app/login/page.tsx',
  auth: 'auth.ts',
  http: 'lib/server/portfolio/http.ts',
  portfolio: 'app/api/portfolio/route.ts',
  lots: 'app/api/portfolio/lots/route.ts',
  lotById: 'app/api/portfolio/lots/[id]/route.ts',
  saveLot: 'app/api/portfolio/lots/save/route.ts',
  importPortfolio: 'app/api/portfolio/import/route.ts',
  exportPortfolio: 'app/api/portfolio/export/route.ts',
  sharePortfolio: 'app/api/portfolio/share/route.ts',
  simulatePortfolio: 'app/api/portfolio/simulate/route.ts',
  en: 'i18n/translations/en.json',
  pl: 'i18n/translations/pl.json',
} as const;

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

function expectContains(source: string, fragment: string) {
  expect(source).toContain(fragment);
}

function expectNotContains(source: string, fragment: string) {
  expect(source).not.toContain(fragment);
}

describe('portfolio auth boundary contracts', () => {
  it('keeps Auth.js configured as OAuth-only with Google and GitHub providers', () => {
    const source = read(files.auth);

    expectContains(source, 'import GitHub from "next-auth/providers/github";');
    expectContains(source, 'import Google from "next-auth/providers/google";');
    expectContains(source, 'pages: {');
    expectContains(source, 'signIn: "/login"');
    expectContains(source, 'if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET)');
    expectContains(source, 'if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)');
    expectNotContains(source, 'CredentialsProvider');
    expectNotContains(source, 'next-auth/providers/credentials');
  });

  it('provides a focused login page for external providers only', () => {
    const source = read(files.login);
    const en = read(files.en);
    const pl = read(files.pl);

    expectContains(source, "href: '/api/auth/signin/google'");
    expectContains(source, "href: '/api/auth/signin/github'");
    expectContains(source, 'Calculators stay available without an account.');
    expectContains(source, 'Saving lots, importing portfolios,');
    expectContains(source, "getLocalizedPageMetadata('login')");
    expectContains(en, '"login": {');
    expectContains(pl, '"login": {');
    expectNotContains(source, 'type="password"');
    expectNotContains(source, 'email');
  });

  it('centralizes authenticated portfolio route checks', () => {
    const source = read(files.http);

    expectContains(source, 'getAuthenticatedPortfolioRouteContext');
    expectContains(source, "context.owner.authMode !== 'authenticated' || context.owner.isGuest");
    expectContains(source, 'response: createUnauthorizedResponse()');
  });

  it('requires authenticated context for portfolio mutations and data extraction', () => {
    for (const relativePath of [
      files.portfolio,
      files.lots,
      files.lotById,
      files.saveLot,
      files.importPortfolio,
      files.exportPortfolio,
      files.sharePortfolio,
      files.simulatePortfolio,
    ]) {
      const source = read(relativePath);

      expectContains(source, 'getAuthenticatedPortfolioRouteContext');
      expectContains(source, 'if (!authContext.ok) return authContext.response;');
      expectContains(source, 'const { owner } = authContext.context;');
    }
  });
});
