import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  cardmarketArticleUrl,
  cardmarketProductSearchUrl,
  cardmarketShoppingCartUrl,
} from '../../src/lib/cardmarket-browser/links';

describe('cardmarket-browser links', () => {
  it('builds product search URL', () => {
    const url = cardmarketProductSearchUrl('Lightning Bolt');
    assert.match(url, /searchString=Lightning%20Bolt/);
    assert.match(url, /\/en\/Magic\//);
  });

  it('builds article URL', () => {
    assert.equal(cardmarketArticleUrl(123), 'https://www.cardmarket.com/en/Magic/Articles/123');
  });

  it('builds cart URL', () => {
    assert.equal(
      cardmarketShoppingCartUrl(),
      'https://www.cardmarket.com/en/Magic/ShoppingCart'
    );
  });
});
