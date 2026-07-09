const DEFAULT_PRODUCTION_URL = 'https://obligacje-calculator-ji72nqwtea-lm.a.run.app';
const DEFAULT_DEVELOPMENT_URL = 'http://localhost:3000';

export function getCanonicalBaseUrl(env: NodeJS.ProcessEnv = process.env) {
  const configuredUrl = env.NEXT_PUBLIC_APP_URL?.trim();
  const fallbackUrl =
    env.NODE_ENV === 'production' ? DEFAULT_PRODUCTION_URL : DEFAULT_DEVELOPMENT_URL;

  return (configuredUrl || fallbackUrl).replace(/\/+$/, '');
}

export function getCanonicalUrl(path = '', env: NodeJS.ProcessEnv = process.env) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${getCanonicalBaseUrl(env)}${normalizedPath === '/' ? '' : normalizedPath}`;
}
