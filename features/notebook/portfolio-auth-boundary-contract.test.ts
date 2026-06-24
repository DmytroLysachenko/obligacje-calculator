import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

const files = {
  login: 'app/login/page.tsx',
  auth: 'auth.ts',
  authProviderConfig: 'lib/server/auth/provider-config.ts',
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
  it('keeps Auth.js configured as OAuth-only with Google and Facebook providers', () => {
    const source = read(files.auth);
    const providerConfig = read(files.authProviderConfig);

    expectContains(source, 'import Facebook from "next-auth/providers/facebook";');
    expectContains(source, 'import Google from "next-auth/providers/google";');
    expectContains(source, 'getAuthRuntimeConfig');
    expectContains(source, 'pages: {');
    expectContains(source, 'signIn: "/login"');
    expectContains(providerConfig, 'getConfiguredOAuthProviders');
    expectContains(providerConfig, 'AUTH_FACEBOOK_ID');
    expectContains(providerConfig, 'AUTH_GOOGLE_ID');
    expectNotContains(source, 'next-auth/providers/github');
    expectNotContains(source, 'CredentialsProvider');
    expectNotContains(source, 'next-auth/providers/credentials');
  });

  it('provides a focused login page for external providers only', () => {
    const source = read(files.login);
    const en = read(files.en);
    const pl = read(files.pl);

    expectContains(source, "await signIn(provider.id, { redirectTo: '/notebook' });");
    expectContains(source, "id: 'google'");
    expectContains(source, "id: 'facebook'");
    expectContains(source, "t('login.description')");
    expectContains(source, "t('login.oauth_only_note')");
    expectContains(source, "getLocalizedPageMetadata('login')");
    expectContains(en, '"providers": {');
    expectContains(en, '"facebook": "Continue with Facebook"');
    expectContains(pl, '"facebook": "Kontynuuj z Facebook"');
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

      expectContains(source, 'withAuthenticatedPortfolioOwner');
    }
  });
});
