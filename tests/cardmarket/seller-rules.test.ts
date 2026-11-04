import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  listingMatchesRules,
  parsePriceEur,
  parseSalesFromTooltip,
  pickCheapestMatchingListing,
  DEFAULT_SELLER_RULES,
} from '../../src/lib/cardmarket-browser/seller-rules';

describe('cardmarket seller rules', () => {
  it('parses sales count from tooltip', () => {
    assert.equal(parseSalesFromTooltip('650\u00a0Sales\u00a0|\u00a0419\u00a0Available items'), 650);
  });

  it('parses EUR price', () => {
    assert.equal(parsePriceEur('10,40 €'), 10.4);
  });

  it('picks cheapest German seller with enough sales', () => {
    const rules = DEFAULT_SELLER_RULES;
    const listings = [
      {
        seller: 'A',
        itemLocation: 'France',
        salesCount: 500,
        priceEur: 1,
        priceLabel: '1,00 €',
        buyable: true,
        rowIndex: 0,
      },
      {
        seller: 'B',
        itemLocation: 'Germany',
        salesCount: 50,
        priceEur: 0.5,
        priceLabel: '0,50 €',
        buyable: true,
        rowIndex: 1,
      },
      {
        seller: 'C',
        itemLocation: 'Germany',
        salesCount: 200,
        priceEur: 2,
        priceLabel: '2,00 €',
        buyable: true,
        rowIndex: 2,
      },
    ];
    const pick = pickCheapestMatchingListing(listings, rules);
    assert.equal(pick?.seller, 'C');
    assert.ok(listingMatchesRules(pick!, rules));
  });
});
