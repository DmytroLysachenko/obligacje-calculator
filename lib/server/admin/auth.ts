import { getSyncSecret, isProductionRuntime, readRuntimeEnv, type RuntimeEnv } from '@/lib/server/runtime/env';

export function assertAdminSyncAuthorization(authorizationHeader: string | null) {
  const env = readRuntimeEnv();
  assertAdminSyncAuthorizationForEnv(authorizationHeader, env);
}

export function assertAdminSyncAuthorizationForEnv(
  authorizationHeader: string | null,
  env: RuntimeEnv,
) {
  if (isProductionRuntime(env) && authorizationHeader !== `Bearer ${getSyncSecret(env)}`) {
    throw new Error('UNAUTHORIZED_SYNC_REQUEST');
  }
}
