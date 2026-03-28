import { NextRequest, NextResponse } from 'next/server';
import { SyncEngine } from '@/lib/sync/sync-engine';
import { NbpSyncProvider } from '@/lib/sync/providers/nbp';
import { StooqSyncProvider } from '@/lib/sync/providers/stooq';
import { WorldBankSyncProvider } from '@/lib/sync/providers/worldbank';
import { seedSeriesMetadata } from '@/lib/sync/seed-series-runner';
import { seedMarketHistory } from '@/lib/sync/seed-market-history';
import { syncMarketHistory } from '@/lib/sync/sync-market-history';

type SyncMode = 'full-sync' | 'market-history-seed' | 'market-history-sync' | 'metadata-seed';

export async function POST(req: NextRequest) {
  // Simple auth check (in a real app, use a secret header or Clerk/NextAuth)
  const authHeader = req.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.SYNC_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { mode?: SyncMode };
    const mode = body.mode ?? 'full-sync';
    let results: unknown;

    if (mode === 'metadata-seed') {
      await seedSeriesMetadata();
      results = { mode, status: 'success' };
    } else if (mode === 'market-history-seed') {
      results = await seedMarketHistory();
    } else if (mode === 'market-history-sync') {
      results = await syncMarketHistory();
    } else {
      const providers = [new WorldBankSyncProvider(), new NbpSyncProvider(), new StooqSyncProvider()];
      const engine = new SyncEngine(providers);
      results = await engine.runFullSync();
    }

    return NextResponse.json({
      message: 'Sync completed successfully',
      timestamp: new Date().toISOString(),
      mode,
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
    modes: ['full-sync', 'metadata-seed', 'market-history-seed', 'market-history-sync'],
  });
}
