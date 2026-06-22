export interface RuntimeEnv {
  NODE_ENV?: string;
  DATABASE_URL?: string;
  AUTH_SECRET?: string;
  NEXTAUTH_SECRET?: string;
  AUTH_GOOGLE_ID?: string;
  AUTH_GOOGLE_SECRET?: string;
  AUTH_FACEBOOK_ID?: string;
  AUTH_FACEBOOK_SECRET?: string;
  SYNC_SECRET?: string;
  NEXT_PUBLIC_APP_URL?: string;
}

export type OAuthProviderName = 'google' | 'facebook';

export function readRuntimeEnv(env: NodeJS.ProcessEnv = process.env): RuntimeEnv {
  return env;
}

export function isProductionRuntime(env: RuntimeEnv = readRuntimeEnv()) {
  return env.NODE_ENV === 'production';
}

export function getDatabaseUrl(env: RuntimeEnv = readRuntimeEnv()) {
  return env.DATABASE_URL;
}

export function getAuthSecret(env: RuntimeEnv = readRuntimeEnv()) {
  return env.AUTH_SECRET ?? env.NEXTAUTH_SECRET;
}

export function hasAuthSecret(env: RuntimeEnv = readRuntimeEnv()) {
  return Boolean(getAuthSecret(env));
}

export function getSyncSecret(env: RuntimeEnv = readRuntimeEnv()) {
  return env.SYNC_SECRET;
}

export function getPublicAppUrl(env: RuntimeEnv = readRuntimeEnv()) {
  return env.NEXT_PUBLIC_APP_URL;
}

export function getConfiguredOAuthProviders(env: RuntimeEnv = readRuntimeEnv()): OAuthProviderName[] {
  const providers: OAuthProviderName[] = [];

  if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
    providers.push('google');
  }

  if (env.AUTH_FACEBOOK_ID && env.AUTH_FACEBOOK_SECRET) {
    providers.push('facebook');
  }

  return providers;
}

export function hasOAuthProvider(env: RuntimeEnv = readRuntimeEnv()) {
  return getConfiguredOAuthProviders(env).length > 0;
}
