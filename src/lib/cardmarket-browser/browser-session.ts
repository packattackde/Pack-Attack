import { existsSync } from 'fs';
import type { Browser, BrowserContext, Page } from 'playwright';
import type { CardmarketBrowserConfig } from './config';
import { launchCardmarketBrowser, STEALTH_INIT_SCRIPT } from './playwright-launch';

export class CardmarketBrowserSession {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  constructor(private readonly config: CardmarketBrowserConfig) {}

  static requireStorageFile(config: CardmarketBrowserConfig): void {
    if (!existsSync(config.storageStatePath)) {
      throw new Error(
        `Cardmarket session missing at ${config.storageStatePath}. Run: npm run cardmarket:login (on your PC, not the server).`
      );
    }
  }

  async getPage(): Promise<Page> {
    if (!this.context) {
      CardmarketBrowserSession.requireStorageFile(this.config);
      this.browser = await launchCardmarketBrowser(this.config);
      this.context = await this.browser.newContext({
        storageState: this.config.storageStatePath,
        locale: 'en-GB',
        viewport: { width: 1366, height: 900 },
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      });
      await this.context.addInitScript(STEALTH_INIT_SCRIPT);
    }
    const pages = this.context.pages();
    if (pages.length > 0) return pages[0]!;
    return this.context.newPage();
  }

  async close(): Promise<void> {
    await this.context?.close();
    await this.browser?.close();
    this.context = null;
    this.browser = null;
  }
}
