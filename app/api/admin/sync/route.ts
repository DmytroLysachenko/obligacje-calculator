import { NextRequest, NextResponse } from 'next/server';
import { SyncEngine } from '@/lib/sync/sync-engine';
import { NbpSyncProvider } from '@/lib/sync/providers/nbp';
import { StooqSyncProvider } from '@/lib/sync/providers/stooq';
import { WorldBankSyncProvider } from '@/lib/sync/providers/worldbank';

export async function POST(req: NextRequest) {
  // Simple auth check (in a real app, use a secret header or Clerk/NextAuth)
  const authHeader = req.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.SYNC_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { mode?: 'full-sync' | 'market-history-seed' | 'market-history-sync' };
    const providers = [new WorldBankSyncProvider(), new NbpSyncProvider(), new StooqSyncProvider()];
    const engine = new SyncEngine(providers);

    const results = body.mode === 'market-history-seed'
      ? await engine.syncAll(1990)
      : body.mode === 'market-history-sync'
        ? await engine.syncAll(1990)
        : await engine.runFullSync();

    return NextResponse.json({
      message: 'Sync completed successfully',
      timestamp: new Date().toISOString(),
      mode: body.mode ?? 'full-sync',
      results
    });
  } catch (error) {
    console.error('[AdminSync] Sync failed:', error);
    return NextResponse.json({ 
      error: 'Sync failed', 
      details: String(error) 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Sync endpoint ready',
    instructions: 'POST to this endpoint to trigger a full financial data sync.',
    modes: ['full-sync', 'market-history-seed', 'market-history-sync'],
  });
}
