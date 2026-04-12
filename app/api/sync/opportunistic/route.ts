import { NextResponse } from 'next/server';
import { SyncEngine } from '@/lib/sync/sync-engine';
import { NbpSyncProvider } from '@/lib/sync/providers/nbp';
import { StooqSyncProvider } from '@/lib/sync/providers/stooq';
import { WorldBankSyncProvider } from '@/lib/sync/providers/worldbank';
import { isBefore, subHours } from 'date-fns';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const lastSyncCookie = cookieStore.get('last_sync_check')?.value;
  
  // Cooldown: 12 hours between opportunistic sync checks
  if (lastSyncCookie) {
    const lastDate = new Date(lastSyncCookie);
    if (!isBefore(lastDate, subHours(new Date(), 12))) {
      return NextResponse.json({ status: 'cooldown', lastChecked: lastSyncCookie });
    }
  }

  // Set cookie immediately to prevent concurrent triggers from same client
  const response = NextResponse.json({ status: 'triggered' });
  response.cookies.set('last_sync_check', new Date().toISOString(), { 
    maxAge: 60 * 60 * 12, // 12 hours
    path: '/',
    httpOnly: true
  });

  // Background sync (don't await)
  (async () => {
    try {
      console.log('[OpportunisticSync] Starting background sync...');
      const providers = [new WorldBankSyncProvider(), new NbpSyncProvider(), new StooqSyncProvider()];
      const engine = new SyncEngine(providers);
      await engine.runFullSync();
      console.log('[OpportunisticSync] Background sync completed.');
    } catch (error) {
      console.error('[OpportunisticSync] Background sync failed:', error);
    }
  })();

  return response;
}
