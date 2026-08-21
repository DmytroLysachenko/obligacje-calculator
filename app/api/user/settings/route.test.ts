import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPortfolioRouteContext: vi.fn(),
  updateOwnerSettings: vi.fn(),
}));

vi.mock('@/lib/server/portfolio/http', () => ({
  getPortfolioRouteContext: mocks.getPortfolioRouteContext,
  withPortfolioOwnerResponse: (response: Response) => response,
}));
vi.mock('@/lib/server/settings/service', () => ({
  updateOwnerSettings: mocks.updateOwnerSettings,
}));

import { PATCH } from './route';

describe('settings PATCH boundary', () => {
  beforeEach(() => {
    mocks.getPortfolioRouteContext.mockReset();
    mocks.updateOwnerSettings.mockReset();
    mocks.getPortfolioRouteContext.mockResolvedValue({ owner: { ownerId: 'owner-1' } });
    mocks.updateOwnerSettings.mockResolvedValue({ theme: 'dark' });
  });

  it('accepts only supported settings values', async () => {
    const response = await PATCH(
      new NextRequest('http://localhost/api/user/settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ theme: 'dark', chartType: 'line' }),
      }) as never,
      {} as never,
    );

    expect(response.status).toBe(200);
    expect(mocks.updateOwnerSettings).toHaveBeenCalledWith('owner-1', {
      theme: 'dark',
      chartType: 'line',
    });
  });

  it('rejects unknown values and oversized bodies before settings persistence', async () => {
    const invalid = await PATCH(
      new NextRequest('http://localhost/api/user/settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ theme: 'attacker-controlled' }),
      }) as never,
      {} as never,
    );
    const tooLarge = await PATCH(
      new NextRequest('http://localhost/api/user/settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ theme: 'x'.repeat(9 * 1024) }),
      }) as never,
      {} as never,
    );

    expect(invalid.status).toBe(400);
    expect(tooLarge.status).toBe(413);
    expect(mocks.updateOwnerSettings).not.toHaveBeenCalled();
  });
});
