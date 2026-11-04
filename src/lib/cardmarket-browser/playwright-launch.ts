import { chromium, type Browser, type LaunchOptions } from 'playwright';
import type { CardmarketBrowserConfig } from './config';

const STEALTH_ARGS = [
  '--disable-blink-features=AutomationControlled',
  '--no-sandbox',
  '--disable-dev-shm-usage',
];

export async function launchCardmarketBrowser(
  config: CardmarketBrowserConfig
): Promise<Browser> {
  const opts: LaunchOptions = {
    headless: config.headless,
    args: STEALTH_ARGS,
  };

  try {
    return await chromium.launch({ ...opts, channel: 'chrome' });
  } catch {
    return await chromium.launch(opts);
  }
}

export const STEALTH_INIT_SCRIPT = `
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
`;
