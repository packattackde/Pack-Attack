import { existsSync } from 'fs';
import { resolve } from 'path';
import { DEFAULT_SELLER_RULES, type SellerRules } from './seller-rules';

export type CardmarketBrowserConfig = {
  /** Playwright storageState JSON (login once via npm run cardmarket:login). */
  storageStatePath: string;
  /** e.g. https://www.cardmarket.com/en/Magic */
  gameBasePath: string;
  headless: boolean;
  /** Never true in automation unless explicitly placing orders. */
  allowCheckout: boolean;
  sellerRules: SellerRules;
};

const DEFAULT_GAME_BASE = 'https://www.cardmarket.com/en/Magic';

export function loadCardmarketBrowserConfigFromEnv(): CardmarketBrowserConfig {
  const storageStatePath = resolve(
    process.cwd(),
    process.env.CARDMARKET_BROWSER_STORAGE ?? '.cardmarket/storage.json'
  );
  const countriesRaw = process.env.CARDMARKET_SELLER_COUNTRIES ?? 'Germany';
  const sellerCountries = countriesRaw
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  const minSalesRaw = process.env.CARDMARKET_MIN_SELLER_SALES ?? '100';
  const minSellerSales = Number.parseInt(minSalesRaw, 10);

  return {
    storageStatePath,
    gameBasePath: process.env.CARDMARKET_BROWSER_GAME_BASE ?? DEFAULT_GAME_BASE,
    headless: process.env.CARDMARKET_BROWSER_HEADLESS !== 'false',
    allowCheckout: process.env.CARDMARKET_ALLOW_CHECKOUT === 'true',
    sellerRules: {
      sellerCountries: sellerCountries.length > 0 ? sellerCountries : DEFAULT_SELLER_RULES.sellerCountries,
      minSellerSales: Number.isFinite(minSellerSales)
        ? minSellerSales
        : DEFAULT_SELLER_RULES.minSellerSales,
    },
  };
}

export function isCardmarketBrowserConfigured(config?: CardmarketBrowserConfig): boolean {
  const c = config ?? loadCardmarketBrowserConfigFromEnv();
  return existsSync(c.storageStatePath);
}

export function assertCheckoutAllowed(config: CardmarketBrowserConfig): void {
  if (!config.allowCheckout) {
    throw new Error(
      'Cardmarket checkout is disabled. Set CARDMARKET_ALLOW_CHECKOUT=true only when intentionally placing orders.'
    );
  }
}
