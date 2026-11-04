import { existsSync } from 'fs';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import type { CardmarketBrowserConfig } from './config';

export class CardmarketBrowserSession {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  constructor(private readonly config: CardmarketBrowserConfig) {}

  static requireStorageFile(config: CardmarketBrowserConfig): void {
    if (!existsSync(config.storageStatePath)) {
      throw new Error(
        `Cardmarket browser session missing at ${config.storageStatePath}. Run: npm run cardmarket:login`
      );
    }
  }

  async getPage(): Promise<Page> {
    if (!this.context) {
      CardmarketBrowserSession.requireStorageFile(this.config);
      this.browser = await chromium.launch({ headless: this.config.headless });
      this.context = await this.browser.newContext({
        storageState: this.config.storageStatePath,
        locale: 'en-GB',
      });
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
