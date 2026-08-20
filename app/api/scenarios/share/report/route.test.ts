import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

const abuse = vi.hoisted(() => ({ report: vi.fn() }));

vi.mock('@/lib/server/shared-scenarios/abuse', () => ({
  reportSharedScenarioAbuse: abuse.report,
}));

import { POST } from './route';

const context = { params: Promise.resolve({}) };

function request(body: unknown) {
  return new NextRequest('https://calculator.test/api/scenarios/share/report', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-request-id': 'share-report-request-001',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/scenarios/share/report', () => {
  it('records only an opaque reference and returns a uniform acknowledgement', async () => {
    const response = await POST(
      request({ shareId: '123e4567-e89b-12d3-a456-426614174000', reason: 'privacy' }),
      context,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: { accepted: true },
      meta: { requestId: 'share-report-request-001' },
    });
    expect(abuse.report).toHaveBeenCalledWith({
      shareId: '123e4567-e89b-12d3-a456-426614174000',
      reason: 'privacy',
      requestId: 'share-report-request-001',
    });
  });

  it('rejects a malformed report before recording an event', async () => {
    const response = await POST(request({ shareId: 'invalid', reason: 'anything' }), context);

    expect(response.status).toBe(400);
    expect(abuse.report).toHaveBeenCalledTimes(1);
  });
});
