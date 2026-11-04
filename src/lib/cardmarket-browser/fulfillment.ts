import type { Page } from 'playwright';
import type { CardmarketBrowserConfig } from './config';
import { toCardmarketCountryLabel } from './country-codes';
import {
  cardmarketArticleUrl,
  cardmarketProductSearchUrl,
  cardmarketShoppingCartUrl,
} from './links';
import { CardmarketBrowserSession } from './browser-session';
import { addCheapestListingMatchingRules, scrapeProductListings } from './listings';
import { listingMatchesRules } from './seller-rules';
import type { CartSummary, PrepareCartResult, SelectedListing, ShippingAddressInput } from './types';
import type { ParsedListing } from './seller-rules';

export class CardmarketBrowserFulfillment {
  private readonly session: CardmarketBrowserSession;

  constructor(private readonly config: CardmarketBrowserConfig) {
    this.session = new CardmarketBrowserSession(config);
  }

  async close(): Promise<void> {
    await this.session.close();
  }

  async ensureLoggedIn(): Promise<{ username: string | null }> {
    const page = await this.session.getPage();
    await page.goto(this.config.gameBasePath, { waitUntil: 'domcontentloaded' });
    await dismissCookieBanner(page);
    const logout = page.getByRole('button', { name: 'Log out' });
    if (!(await logout.isVisible().catch(() => false))) {
      throw new Error(
        'Not logged in to Cardmarket. Run npm run cardmarket:login and sign in in the opened browser.'
      );
    }
    const userBlock = page.locator('h6').filter({ hasText: /\(.+\)/ }).first();
    const username = (await userBlock.textContent())?.split('(')[0]?.trim() ?? null;
    return { username };
  }

  async getCartSummary(game = 'Magic'): Promise<CartSummary> {
    const page = await this.session.getPage();
    const url = cardmarketShoppingCartUrl({ game });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await dismissCookieBanner(page);
    return readCartSummary(page, url);
  }

  async emptyCart(game = 'Magic'): Promise<CartSummary> {
    const page = await this.session.getPage();
    const cartUrl = cardmarketShoppingCartUrl({ game });
    await page.goto(cartUrl, { waitUntil: 'domcontentloaded' });
    await dismissCookieBanner(page);
    const removeAll = page.getByRole('button', { name: 'Remove all articles' });
    if (await removeAll.isVisible().catch(() => false)) {
      await removeAll.click();
      await page.waitForTimeout(800);
    }
    return readCartSummary(page, cartUrl);
  }

  /** Opens product search, picks first result, adds cheapest listing matching seller rules. */
  async addCheapestFromSearch(
    search: string,
    game = 'Magic'
  ): Promise<{ productUrl: string; selectedListing: SelectedListing }> {
    const page = await this.session.getPage();
    const searchUrl = cardmarketProductSearchUrl(search, { game });
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
    await dismissCookieBanner(page);
    const firstProduct = page.locator('a[href*="/Products/Singles/"]').first();
    await firstProduct.waitFor({ state: 'visible', timeout: 20_000 });
    const href = await firstProduct.getAttribute('href');
    if (!href) throw new Error(`No product found for search: ${search}`);
    const productUrl = href.startsWith('http') ? href : `https://www.cardmarket.com${href}`;
    await page.goto(productUrl, { waitUntil: 'domcontentloaded' });
    await dismissCookieBanner(page);
    const pick = await addCheapestListingMatchingRules(page, this.config.sellerRules);
    return { productUrl, selectedListing: toSelectedListing(pick) };
  }

  async addFromProductUrl(productUrl: string): Promise<SelectedListing> {
    const page = await this.session.getPage();
    await page.goto(productUrl, { waitUntil: 'domcontentloaded' });
    await dismissCookieBanner(page);
    const pick = await addCheapestListingMatchingRules(page, this.config.sellerRules);
    return toSelectedListing(pick);
  }

  async addFromArticleId(idArticle: number): Promise<SelectedListing> {
    const page = await this.session.getPage();
    const url = cardmarketArticleUrl(idArticle);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await dismissCookieBanner(page);
    const listings = await scrapeProductListings(page);
    const listing = listings[0];
    if (!listing || !listingMatchesRules(listing, this.config.sellerRules)) {
      throw new Error(
        `Article ${idArticle} does not match seller rules (Germany, min ${this.config.sellerRules.minSellerSales} sales).`
      );
    }
    await page.locator('button[aria-label="Put in shopping cart"]:not([disabled])').first().click();
    await page.waitForTimeout(600);
    return toSelectedListing(listing);
  }

  async setCartShippingAddress(address: ShippingAddressInput, game = 'Magic'): Promise<void> {
    const page = await this.session.getPage();
    await page.goto(cardmarketShoppingCartUrl({ game }), { waitUntil: 'domcontentloaded' });
    await dismissCookieBanner(page);

    const empty = page.getByText('Your shopping cart is empty', { exact: false });
    if (await empty.isVisible().catch(() => false)) {
      throw new Error('Cardmarket cart is empty — no listing matched seller rules or card was not found.');
    }

    const chooseButtons = page.getByRole('button', { name: 'Choose Shipping Address' });
    const count = await chooseButtons.count();
    if (count === 0) {
      throw new Error('No shipping address control on Cardmarket cart — check login session.');
    }
    for (let i = 0; i < count; i++) {
      await chooseButtons.nth(i).click();
      await fillAddressModal(page, address);
      await page.waitForTimeout(600);
    }
  }

  async prepareCartForCustomer(options: {
    search?: string;
    productUrl?: string;
    idArticle?: number;
    resetCart?: boolean;
    shipping: ShippingAddressInput;
  }): Promise<PrepareCartResult> {
    await this.ensureLoggedIn();
    if (options.resetCart !== false) {
      await this.emptyCart();
    }

    let addedFrom: string | undefined;
    let selectedListing: SelectedListing | undefined;
    if (options.idArticle) {
      addedFrom = cardmarketArticleUrl(options.idArticle);
      selectedListing = await this.addFromArticleId(options.idArticle);
    } else if (options.productUrl) {
      addedFrom = options.productUrl;
      selectedListing = await this.addFromProductUrl(options.productUrl);
    } else if (options.search) {
      const r = await this.addCheapestFromSearch(options.search);
      addedFrom = r.productUrl;
      selectedListing = r.selectedListing;
    } else {
      throw new Error('Provide search, productUrl, or idArticle');
    }

    await this.setCartShippingAddress(options.shipping);
    const cart = await this.getCartSummary();
    return { cart, addedFrom, shippingApplied: true, selectedListing };
  }
}

function toSelectedListing(pick: ParsedListing): SelectedListing {
  return {
    seller: pick.seller,
    itemLocation: pick.itemLocation,
    salesCount: pick.salesCount,
    priceLabel: pick.priceLabel,
  };
}

async function dismissCookieBanner(page: Page): Promise<void> {
  const accept = page.getByRole('button', { name: /accept|agree|allow all/i });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click().catch(() => undefined);
  }
}

async function fillAddressModal(page: Page, address: ShippingAddressInput): Promise<void> {
  const modal = page.locator('.modal.show, .modal-content').first();
  await modal.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined);

  await page.locator('input[name="receiverName"]').fill(address.name);
  if (address.extra) {
    await page.locator('input[name="extra"]').fill(address.extra);
  }
  await page.locator('input[name="street"]').fill(address.street);
  await page.locator('input[name="city"]').fill(address.city);
  await page.locator('input[name="postCode"]').fill(address.zip);
  const countryLabel = toCardmarketCountryLabel(address.country);
  const countrySelect = page.locator('select[name="idCountry"]');
  await countrySelect.selectOption({ label: countryLabel }).catch(async () => {
    await countrySelect.selectOption({ value: countryLabel });
  });

  const save = modal.getByRole('button', { name: /save|select|confirm|apply/i }).first();
  if (await save.isVisible().catch(() => false)) {
    await save.click();
  } else {
    await page.locator('.modal button[type="submit"]').first().click();
  }
  await page.waitForTimeout(800);
}

async function readCartSummary(page: Page, url: string): Promise<CartSummary> {
  const empty = page.getByText('Your shopping cart is empty', { exact: false });
  if (await empty.isVisible().catch(() => false)) {
    return { itemCount: 0, totalLabel: null, url };
  }
  const overview = page.locator('h3').filter({ hasText: /Cart overview/i }).first();
  const totalLabel = (await overview.textContent())?.replace(/\s+/g, ' ').trim() ?? null;
  const singlesHeading = page.locator('h3').filter({ hasText: /Singles \(\d+\)/i }).first();
  const singlesText = (await singlesHeading.textContent()) ?? '';
  const match = singlesText.match(/\((\d+)\)/);
  const itemCount = match ? Number.parseInt(match[1]!, 10) : 1;
  return { itemCount, totalLabel, url };
}
