import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  importOwnerPortfolio: vi.fn(),
  withAuthenticatedPortfolioOwner: vi.fn(),
}));

vi.mock('@/lib/server/portfolio/commands', () => ({
  importOwnerPortfolio: mocks.importOwnerPortfolio,
}));
vi.mock('@/lib/server/portfolio/http', () => ({
  withAuthenticatedPortfolioOwner: mocks.withAuthenticatedPortfolioOwner,
}));

import { POST } from './route';

const valid = {
  portfolio: {
    name: 'Imported bonds',
    lots: [{ bondType: 'COI', purchaseDate: '2026-07-30', amount: '100.00' }],
  },
};

describe('portfolio import endpoint', () => {
  beforeEach(() => {
    mocks.importOwnerPortfolio.mockReset();
    mocks.withAuthenticatedPortfolioOwner.mockImplementation(async (_request, handler) =>
      handler({ ownerId: 'owner-1' }),
    );
  });

  it('passes a validated complete payload to the authenticated owner transaction', async () => {
    mocks.importOwnerPortfolio.mockResolvedValue({
      portfolio: { id: 'portfolio-1' },
      importedLots: 1,
    });

    const response = await POST(
      new NextRequest('https://example.test/api/portfolio/import', {
        method: 'POST',
        body: JSON.stringify(valid),
        headers: { 'content-type': 'application/json' },
      }) as never,
      {} as never,
    );

    expect(response.status).toBe(200);
    expect(mocks.importOwnerPortfolio).toHaveBeenCalledWith('owner-1', valid.portfolio);
    await expect(response.json()).resolves.toMatchObject({ data: { importedLots: 1 } });
  });

  it.each([
    ['malformed JSON', '{'],
    ['missing lots', JSON.stringify({ portfolio: { name: 'bad' } })],
    [
      'invalid calendar date',
      JSON.stringify({
        ...valid,
        portfolio: {
          ...valid.portfolio,
          lots: [{ ...valid.portfolio.lots[0], purchaseDate: '2026-02-30' }],
        },
      }),
    ],
    [
      'unsupported bond encoding',
      JSON.stringify({
        ...valid,
        portfolio: {
          ...valid.portfolio,
          lots: [{ ...valid.portfolio.lots[0], bondType: 'UNKNOWN' }],
        },
      }),
    ],
  ])('does not invoke import for %s', async (_name, body) => {
    const response = await POST(
      new NextRequest('https://example.test/api/portfolio/import', {
        method: 'POST',
        body,
        headers: { 'content-type': 'application/json' },
      }) as never,
      {} as never,
    );

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(mocks.importOwnerPortfolio).not.toHaveBeenCalled();
  });

  it('rejects a declared oversize body before JSON parsing or import work', async () => {
    const response = await POST(
      new NextRequest('https://example.test/api/portfolio/import', {
        method: 'POST',
        body: '{}',
        headers: { 'content-length': `${256 * 1024 + 1}` },
      }) as never,
      {} as never,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'PAYLOAD_TOO_LARGE' } });
    expect(mocks.importOwnerPortfolio).not.toHaveBeenCalled();
  });

  it('does not accept duplicate input as a partial import', async () => {
    const response = await POST(
      new NextRequest('https://example.test/api/portfolio/import', {
        method: 'POST',
        body: JSON.stringify({
          ...valid,
          portfolio: {
            ...valid.portfolio,
            lots: [valid.portfolio.lots[0], valid.portfolio.lots[0]],
          },
        }),
      }) as never,
      {} as never,
    );

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(mocks.importOwnerPortfolio).not.toHaveBeenCalled();
  });
});
