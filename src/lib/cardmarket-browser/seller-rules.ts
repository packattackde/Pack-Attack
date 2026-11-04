/** Pullforge defaults for Cardmarket warehouse buying. */
export type SellerRules = {
  /** Seller item location countries (Cardmarket filter + row verification). */
  sellerCountries: string[];
  /**
   * Minimum seller completed sales shown on listings (Cardmarket tooltip: "650 Sales | …").
   * Users often call this "reviews"; MKM does not expose a separate review count on the product table.
   */
  minSellerSales: number;
};

export const DEFAULT_SELLER_RULES: SellerRules = {
  sellerCountries: ['Germany'],
  minSellerSales: 100,
};

export type ParsedListing = {
  seller: string | null;
  itemLocation: string | null;
  salesCount: number | null;
  priceEur: number | null;
  priceLabel: string | null;
  buyable: boolean;
  rowIndex: number;
};

export function parseSalesFromTooltip(text: string | null | undefined): number | null {
  if (!text) return null;
  const match = text.replace(/\u00a0/g, ' ').match(/(\d[\d.,\s]*)\s*Sales/i);
  if (!match) return null;
  const digits = match[1]!.replace(/[^\d]/g, '');
  return digits ? Number.parseInt(digits, 10) : null;
}

export function parseItemLocation(tooltipTexts: string[]): string | null {
  const hit = tooltipTexts.find((t) => t.startsWith('Item location:'));
  if (!hit) return null;
  return hit.replace('Item location:', '').trim();
}

export function parsePriceEur(label: string | null | undefined): number | null {
  if (!label) return null;
  const normalized = label.replace(/\u00a0/g, ' ').replace(/[^\d,.]/g, '').replace(',', '.');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

export function listingMatchesRules(listing: ParsedListing, rules: SellerRules): boolean {
  if (!listing.buyable) return false;
  const country = listing.itemLocation;
  if (country && !rules.sellerCountries.some((c) => c.toLowerCase() === country.toLowerCase())) {
    return false;
  }
  if (listing.salesCount != null && listing.salesCount < rules.minSellerSales) {
    return false;
  }
  if (listing.salesCount == null) {
    return false;
  }
  return listing.priceEur != null;
}

export function pickCheapestMatchingListing(
  listings: ParsedListing[],
  rules: SellerRules
): ParsedListing | null {
  const eligible = listings.filter((l) => listingMatchesRules(l, rules));
  if (eligible.length === 0) return null;
  eligible.sort((a, b) => (a.priceEur ?? Infinity) - (b.priceEur ?? Infinity));
  return eligible[0] ?? null;
}

/** Cardmarket seller country checkbox name for Germany on product filters. */
export const CARDMARKET_GERMANY_COUNTRY_INPUT = 'sellerCountry[7]';
