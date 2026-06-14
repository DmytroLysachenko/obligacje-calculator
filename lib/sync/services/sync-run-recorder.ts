import {
  recordSyncRun,
  type RecordSyncRunInput,
} from '@/lib/server/sync/run-history';

import type { SyncLogger } from '../sync-logger';

export class SyncRunRecorder {
  constructor(private readonly logger: SyncLogger) {}

  async record(input: RecordSyncRunInput) {
    try {
      return await recordSyncRun(input);
    } catch (error) {
      this.logger.error('Failed to persist sync run history', error);
      return null;
    }
  }
}
