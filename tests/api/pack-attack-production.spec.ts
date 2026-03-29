import { test, expect } from '@playwright/test';

/**
 * Smoke tests against the live site (https://pack-attack.de).
 * Run explicitly: `npx playwright test tests/api/pack-attack-production.spec.ts --project=chromium`
 */
const PRODUCTION_ORIGIN = process.env.PACK_ATTACK_PROD_URL ?? 'https://pack-attack.de';

test.describe('pack-attack.de production', () => {
  test('GET /api/health returns 200 and status field', async ({ request }) => {
    const response = await request.get(`${PRODUCTION_ORIGIN}/api/health`);
    const body = await response.text();
    expect(response.ok(), body).toBeTruthy();
    const data = JSON.parse(body);
    expect(data).toHaveProperty('status');
    expect(['healthy', 'degraded', 'ok']).toContain(data.status);
  });

  test('GET / does not 5xx', async ({ request }) => {
    const response = await request.get(PRODUCTION_ORIGIN, { maxRedirects: 5 });
    expect(response.status()).toBeLessThan(500);
  });

  test('GET /api/boxes returns boxes array', async ({ request }) => {
    const response = await request.get(`${PRODUCTION_ORIGIN}/api/boxes`);
    expect(response.ok(), await response.text()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('boxes');
    expect(Array.isArray(data.boxes)).toBeTruthy();
  });
});
