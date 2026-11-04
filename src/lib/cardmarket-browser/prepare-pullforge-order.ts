import type { CardmarketBrowserFulfillment } from './fulfillment';
import type { ShippingAddressInput } from './types';
import { cardmarketShoppingCartUrl } from './links';
import { assertSingleCardmarketGame } from './cardmarket-game';

export type PullforgeOrderLine = {
  cardName: string;
};

export type PullforgeOrderShipment = {
  orderId: string;
  shipping: ShippingAddressInput;
  items: PullforgeOrderLine[];
};

export type PreparePullforgeOrderResult = {
  cartUrl: string;
  lines: Array<{
    cardName: string;
    productUrl?: string;
    seller: string | null;
    salesCount: number | null;
    priceLabel: string | null;
  }>;
  cart: Awaited<ReturnType<CardmarketBrowserFulfillment['getCartSummary']>>;
};

/** One Pullforge order → one MKM cart (empty first, add all lines, one ship-to). */
export async function preparePullforgeOrderInCardmarket(
  fulfillment: CardmarketBrowserFulfillment,
  order: PullforgeOrderShipment
): Promise<PreparePullforgeOrderResult> {
  if (order.items.length === 0) {
    throw new Error('Order has no items');
  }

  const game = assertSingleCardmarketGame(order.items.map((i) => i.cardName));

  await fulfillment.ensureLoggedIn();
  await fulfillment.emptyCart(game);

  const lines: PreparePullforgeOrderResult['lines'] = [];
  for (const item of order.items) {
    const added = await fulfillment.addCheapestFromSearch(item.cardName, game);
    lines.push({
      cardName: item.cardName,
      productUrl: added.productUrl,
      seller: added.selectedListing.seller,
      salesCount: added.selectedListing.salesCount,
      priceLabel: added.selectedListing.priceLabel,
    });
  }

  await fulfillment.setCartShippingAddress(order.shipping, game);
  const cart = await fulfillment.getCartSummary(game);

  if (cart.itemCount < order.items.length) {
    throw new Error(
      `Cardmarket cart has ${cart.itemCount} item(s) but order has ${order.items.length} — check seller rules or card names.`
    );
  }

  return {
    cartUrl: cardmarketShoppingCartUrl({ game }),
    lines,
    cart,
  };
}

export function pullforgeOrderToShipment(order: {
  id: string;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingZip: string;
  shippingCountry: string;
  items: { cardName: string }[];
}): PullforgeOrderShipment {
  return {
    orderId: order.id,
    shipping: {
      name: order.shippingName,
      street: order.shippingAddress,
      city: order.shippingCity,
      zip: order.shippingZip,
      country: order.shippingCountry,
    },
    items: order.items.map((i) => ({ cardName: i.cardName })),
  };
}
