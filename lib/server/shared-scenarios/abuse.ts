import { createServerLogger } from '@/lib/server/logging';

const logger = createServerLogger('SharedScenarioAbuse');

/**
 * Records a report without resolving the share. This deliberately makes
 * unknown, expired, and published identifiers indistinguishable to reporters.
 */
export function reportSharedScenarioAbuse(input: {
  shareId: string;
  reason: 'spam' | 'illegal-content' | 'privacy' | 'other';
  requestId: string;
}) {
  logger.warn('Shared scenario abuse report received', {
    shareId: input.shareId,
    reason: input.reason,
    requestId: input.requestId,
  });
}
