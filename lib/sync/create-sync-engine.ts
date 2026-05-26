import {GusSyncProvider} from './providers/gus';
import {NbpSyncProvider} from './providers/nbp';
import {StooqSyncProvider} from './providers/stooq';
import {createSyncLogger} from './sync-logger';
import {SyncEngine} from './sync-engine';

export function createDefaultSyncEngine(scope = 'SyncEngine') {
  return new SyncEngine(
    [
      new NbpSyncProvider(),
      new StooqSyncProvider(),
      new GusSyncProvider(),
    ],
    createSyncLogger(scope),
  );
}
