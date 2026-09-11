import { expect, test } from '@playwright/test';

test('persists a portfolio through the authenticated browser session', async ({ page }) => {
  await page.goto('/notebook', { waitUntil: 'networkidle' });

  const created = await page.evaluate(async () => {
    const response = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Playwright integration portfolio' }),
    });
    return { body: await response.json(), status: response.status };
  });
  expect(created.status).toBe(200);
  expect(created.body.data).toMatchObject({ name: 'Playwright integration portfolio' });

  const savedLot = await page.evaluate(async (portfolioId) => {
    const response = await fetch('/api/portfolio/lots/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        portfolioId,
        bondType: 'COI',
        purchaseDate: '2026-01-01',
        amount: 2,
        isRebought: false,
      }),
    });
    return { body: await response.json(), status: response.status };
  }, created.body.data.id);
  expect(savedLot.status).toBe(200);
  expect(savedLot.body.data).toMatchObject({ portfolioId: created.body.data.id, amount: '2' });

  const updatedLot = await page.evaluate(
    async ({ lotId, portfolioId }) => {
      const response = await fetch(`/api/portfolio/lots/${lotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Edited through authenticated browser session' }),
      });
      const lotsResponse = await fetch(`/api/portfolio/lots?portfolioId=${portfolioId}`);
      return {
        body: await response.json(),
        lots: await lotsResponse.json(),
        lotsStatus: lotsResponse.status,
        status: response.status,
      };
    },
    { lotId: savedLot.body.data.id, portfolioId: created.body.data.id },
  );
  expect(updatedLot.status).toBe(200);
  expect(updatedLot.lotsStatus).toBe(200);
  expect(updatedLot.body.data).toMatchObject({
    notes: 'Edited through authenticated browser session',
  });
  expect(updatedLot.lots.data).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: savedLot.body.data.id,
        notes: 'Edited through authenticated browser session',
      }),
    ]),
  );

  const portfolios = await page.evaluate(async () => {
    const response = await fetch('/api/portfolio');
    return { body: await response.json(), status: response.status };
  });
  expect(portfolios.status).toBe(200);
  expect(portfolios.body.data).toEqual(
    expect.arrayContaining([expect.objectContaining({ id: created.body.data.id })]),
  );
});
