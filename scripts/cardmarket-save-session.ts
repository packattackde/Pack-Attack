#!/usr/bin/env tsx
/**
 * One-time (or when session expires): log in to Cardmarket in a real browser window,
 * then save cookies to .cardmarket/storage.json for Playwright automation.
 */
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import readline from 'readline';
import { chromium } from 'playwright';
import { loadCardmarketBrowserConfigFromEnv } from '../src/lib/cardmarket-browser';

async function waitForEnter(prompt: string): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise<void>((done) => {
    rl.question(prompt, () => {
      rl.close();
      done();
    });
  });
}

async function main() {
  const config = loadCardmarketBrowserConfigFromEnv();
  mkdirSync(dirname(config.storageStatePath), { recursive: true });

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ locale: 'en-GB' });
  const page = await context.newPage();
  await page.goto('https://www.cardmarket.com/en/Account/Login', { waitUntil: 'domcontentloaded' });

  console.log('\n1. Sign in to Cardmarket in the browser window.');
  console.log('2. When you see your account (Log out in the menu), return here.\n');
  await waitForEnter('Press Enter to save session… ');

  await page.goto(`${config.gameBasePath}`, { waitUntil: 'domcontentloaded' });
  const loggedIn = await page.getByRole('button', { name: 'Log out' }).isVisible().catch(() => false);
  if (!loggedIn) {
    await browser.close();
    throw new Error('Still not logged in. Run again and complete login before pressing Enter.');
  }

  await context.storageState({ path: config.storageStatePath });
  await browser.close();
  console.log(`Saved session to ${resolve(config.storageStatePath)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
