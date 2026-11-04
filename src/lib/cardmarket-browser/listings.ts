import type { Page } from 'playwright';
import {
  CARDMARKET_GERMANY_COUNTRY_INPUT,
  parseItemLocation,
  parsePriceEur,
  parseSalesFromTooltip,
  pickCheapestMatchingListing,
  type ParsedListing,
  type SellerRules,
} from './seller-rules';

type RawRow = {
  seller: string | null;
  tooltips: string[];
  priceLabel: string | null;
  buyable: boolean;
  rowIndex: number;
};

export async function applySellerCountryFilters(page: Page, rules: SellerRules): Promise<void> {
  const wantsGermany = rules.sellerCountries.some((c) => c.toLowerCase() === 'germany');
  if (!wantsGermany) return;

  const base = page.url().split('#')[0]!;
  if (!page.url().includes('#articleFilterSellerLocation')) {
    await page.goto(`${base}#articleFilterSellerLocation`, { waitUntil: 'domcontentloaded' });
  }

  const checkbox = page.locator(`input[name="${CARDMARKET_GERMANY_COUNTRY_INPUT}"]`);
  await checkbox.waitFor({ state: 'attached', timeout: 15_000 });
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }

  const apply = page.locator('input[type="submit"][name="apply"][value="Filter"]');
  await apply.click();
  await page.waitForTimeout(1200);
}

export async function scrapeProductListings(page: Page): Promise<ParsedListing[]> {
  const raw = await page.evaluate((): RawRow[] => {
    return [...document.querySelectorAll('.article-row')].map((row, rowIndex) => {
      const tooltips = [...row.querySelectorAll('[data-bs-original-title], [title]')]
        .map((el) => el.getAttribute('data-bs-original-title') || el.getAttribute('title'))
        .filter((t): t is string => Boolean(t));
      const seller =
        row.querySelector('a[href*="/Users/"]')?.textContent?.trim() ?? null;
      const btn = row.querySelector('button[aria-label="Put in shopping cart"]');
      const priceLabel = row.querySelector('.btn-price')?.textContent?.trim() ?? null;
      const buyable = Boolean(btn && !(btn as HTMLButtonElement).disabled);
      return { seller, tooltips, priceLabel, buyable, rowIndex };
    });
  });

  return raw.map((row) => {
    const salesTooltip = row.tooltips.find((t) => /Sales/i.test(t));
    return {
      seller: row.seller,
      itemLocation: parseItemLocation(row.tooltips),
      salesCount: parseSalesFromTooltip(salesTooltip),
      priceEur: parsePriceEur(row.priceLabel),
      priceLabel: row.priceLabel,
      buyable: row.buyable,
      rowIndex: row.rowIndex,
    };
  });
}

export async function addCheapestListingMatchingRules(
  page: Page,
  rules: SellerRules
): Promise<ParsedListing> {
  await applySellerCountryFilters(page, rules);
  const listings = await scrapeProductListings(page);
  const pick = pickCheapestMatchingListing(listings, rules);
  if (!pick) {
    throw new Error(
      `No buyable listing matches seller rules (countries: ${rules.sellerCountries.join(', ')}; min sales: ${rules.minSellerSales}).`
    );
  }

  const row = page.locator('.article-row').nth(pick.rowIndex);
  await row.locator('button[aria-label="Put in shopping cart"]:not([disabled])').click();
  await page.waitForTimeout(600);
  return pick;
}
