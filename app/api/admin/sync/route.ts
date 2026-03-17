import { NextRequest, NextResponse } from 'next/server';
import { SyncEngine } from '@/lib/sync/sync-engine';
import { NbpSyncProvider } from '@/lib/sync/providers/nbp';
import { StooqSyncProvider } from '@/lib/sync/providers/stooq';
import { WorldBankSyncProvider } from '@/lib/sync/providers/worldbank';

export async function GET(req: NextRequest) {
  // Simple auth check for local development or specific key
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  
  if (process.env.NODE_ENV === 'production' && key !== process.env.SYNC_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startYear = parseInt(searchParams.get('startYear') || '1990');

  const engine = new SyncEngine([
    new NbpSyncProvider(),
    new StooqSyncProvider(),
    new WorldBankSyncProvider()
  ]);

  try {
    const results = await engine.syncAll(startYear);
    return NextResponse.json({ 
      message: 'Sync process completed', 
      results 
    });
  } catch (error) {
    console.error('Sync failed:', error);
    return NextResponse.json({ error: 'Sync failed', details: String(error) }, { status: 500 });
  }
}
