import type { OAuthProviderName, RuntimeEnv } from '@/lib/server/runtime/env';
import { getAuthSecret, getConfiguredOAuthProviders, isProductionRuntime, readRuntimeEnv } from '@/lib/server/runtime/env';

export interface OAuthProviderCredentials {
  name: OAuthProviderName;
  clientId: string;
  clientSecret: string;
}

export interface AuthRuntimeConfig {
  authSecret: string | undefined;
  providers: OAuthProviderCredentials[];
}

export function getAuthRuntimeSecret(env: RuntimeEnv = readRuntimeEnv()) {
  return getAuthSecret(env)
    ?? (!isProductionRuntime(env) ? 'obligacje-calculator-dev-secret' : undefined);
}

export function getOAuthProviderCredentials(env: RuntimeEnv = readRuntimeEnv()): OAuthProviderCredentials[] {
  return getConfiguredOAuthProviders(env).map((name) => {
    if (name === 'google') {
      return {
        name,
        clientId: env.AUTH_GOOGLE_ID as string,
        clientSecret: env.AUTH_GOOGLE_SECRET as string,
      };
    }

    return {
      name,
      clientId: env.AUTH_FACEBOOK_ID as string,
      clientSecret: env.AUTH_FACEBOOK_SECRET as string,
    };
  });
}

export function getAuthRuntimeConfig(env: RuntimeEnv = readRuntimeEnv()): AuthRuntimeConfig {
  return {
    authSecret: getAuthRuntimeSecret(env),
    providers: getOAuthProviderCredentials(env),
  };
}
