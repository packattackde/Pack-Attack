import { chromium, type Browser, type Page } from 'playwright';
import type { CardmarketBrowserConfig } from './config';

/**
 * Uses your real Chrome (remote debugging) — not Playwright-launched Chromium.
 * Cardmarket bot checks block automated browser launches; CDP attach does not.
 */
export class CardmarketBrowserSession {
  private browser: Browser | null = null;

  constructor(private readonly config: CardmarketBrowserConfig) {}

  async getPage(): Promise<Page> {
    if (!this.browser) {
      const cdpUrl = this.config.cdpUrl;
      try {
        this.browser = await chromium.connectOverCDP(cdpUrl, { timeout: 8000 });
      } catch {
        throw new Error(
          'Cannot connect to Chrome. Run: npm run cardmarket:chrome-debug — log into Cardmarket in that Chrome window, then retry auto-fill.'
        );
      }

      const context = this.browser.contexts()[0];
      if (!context) {
        throw new Error('Chrome has no browser context. Restart npm run cardmarket:chrome-debug.');
      }

      const mkmPage = context.pages().find((p) => p.url().includes('cardmarket.com'));
      if (mkmPage) return mkmPage;

      const page = await context.newPage();
      await page.goto('https://www.cardmarket.com/en/', { waitUntil: 'domcontentloaded' });
      return page;
    }

    const context = this.browser.contexts()[0];
    if (!context) throw new Error('Chrome disconnected.');
    const pages = context.pages();
    if (pages.length > 0) return pages[0]!;
    return context.newPage();
  }

  /** Disconnect Playwright from Chrome; does not quit the user’s browser. */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
