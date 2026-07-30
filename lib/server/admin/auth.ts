import {
  getAdminEmailAllowlist,
  getSyncSecret,
  readRuntimeEnv,
  type RuntimeEnv,
} from '@/lib/server/runtime/env';

export type AdminAuthorizationDecision =
  | { authorized: true; method: 'service-token' | 'session' }
  | { authorized: false; reason: 'missing-configuration' | 'unauthorized' };

function hasStrongSecret(secret: string | undefined) {
  return Boolean(secret && secret.trim() === secret && secret.length >= 24);
}

function constantTimeEquals(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export function authorizeServiceAdminRequest(
  authorizationHeader: string | null,
  env: RuntimeEnv,
): AdminAuthorizationDecision {
  const secret = getSyncSecret(env);
  if (!hasStrongSecret(secret) || !secret) {
    return { authorized: false, reason: 'missing-configuration' };
  }
  const prefix = 'Bearer ';
  if (!authorizationHeader?.startsWith(prefix))
    return { authorized: false, reason: 'unauthorized' };
  return constantTimeEquals(authorizationHeader.slice(prefix.length), secret)
    ? { authorized: true, method: 'service-token' }
    : { authorized: false, reason: 'unauthorized' };
}

export function authorizeSessionAdmin(
  email: string | null | undefined,
  env: RuntimeEnv,
): AdminAuthorizationDecision {
  const allowlist = getAdminEmailAllowlist(env);
  if (allowlist.size === 0) return { authorized: false, reason: 'missing-configuration' };
  return email && allowlist.has(email.trim().toLowerCase())
    ? { authorized: true, method: 'session' }
    : { authorized: false, reason: 'unauthorized' };
}

export async function assertAdminSessionAuthorization() {
  const { auth } = await import('@/auth');
  const session = await auth();
  const decision = authorizeSessionAdmin(session?.user?.email, readRuntimeEnv());
  if (!decision.authorized) throw new Error('UNAUTHORIZED_ADMIN_SESSION');
  return decision;
}

export function assertAdminSyncAuthorization(authorizationHeader: string | null) {
  const env = readRuntimeEnv();
  assertAdminSyncAuthorizationForEnv(authorizationHeader, env);
}

export function assertAdminSyncAuthorizationForEnv(
  authorizationHeader: string | null,
  env: RuntimeEnv,
) {
  const decision = authorizeServiceAdminRequest(authorizationHeader, env);
  if (!decision.authorized) {
    throw new Error('UNAUTHORIZED_SYNC_REQUEST');
  }
}
