import { existsSync, mkdirSync, writeFileSync, chmodSync } from 'fs';
import { dirname } from 'path';
import { chromium } from 'playwright';
import type { CardmarketBrowserConfig } from './config';

/** Create storage.json from server env when missing (no manual upload). */
export async function ensureCardmarketStorageState(
  config: CardmarketBrowserConfig
): Promise<void> {
  if (existsSync(config.storageStatePath)) {
    return;
  }

  const username = process.env.CARDMARKET_BROWSER_USERNAME?.trim();
  const password = process.env.CARDMARKET_BROWSER_PASSWORD?.trim();
  if (!username || !password) {
    throw new Error(
      'Cardmarket not logged in on server. Upload session in Admin → Orders, or set CARDMARKET_BROWSER_USERNAME and CARDMARKET_BROWSER_PASSWORD in server .env.'
    );
  }

  mkdirSync(dirname(config.storageStatePath), { recursive: true });

  const browser = await chromium.launch({ headless: config.headless });
  const context = await browser.newContext({ locale: 'en-GB' });
  const page = await context.newPage();

  try {
    await page.goto('https://www.cardmarket.com/en/Account/Login', {
      waitUntil: 'domcontentloaded',
    });

    const userField = page.locator(
      'input[name="username"], input[name="email"], input[type="email"], #username'
    ).first();
    const passField = page.locator('input[name="password"], input[type="password"]').first();
    await userField.waitFor({ state: 'visible', timeout: 20_000 });
    await userField.fill(username);
    await passField.fill(password);

    await page
      .getByRole('button', { name: /log in|sign in|login/i })
      .first()
      .click();

    await page.waitForTimeout(2500);
    await page.goto(config.gameBasePath, { waitUntil: 'domcontentloaded' });

    const loggedIn = await page
      .getByRole('button', { name: 'Log out' })
      .isVisible()
      .catch(() => false);
    if (!loggedIn) {
      throw new Error(
        'Cardmarket login failed (check CARDMARKET_BROWSER_USERNAME / PASSWORD on server).'
      );
    }

    await context.storageState({ path: config.storageStatePath });
    try {
      chmodSync(config.storageStatePath, 0o600);
    } catch {
      /* Windows dev */
    }
  } finally {
    await browser.close();
  }
}
