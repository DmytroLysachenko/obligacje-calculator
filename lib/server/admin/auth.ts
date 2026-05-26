export function assertAdminSyncAuthorization(authorizationHeader: string | null) {
  if (process.env.NODE_ENV === 'production' && authorizationHeader !== `Bearer ${process.env.SYNC_SECRET}`) {
    throw new Error('UNAUTHORIZED_SYNC_REQUEST');
  }
}
