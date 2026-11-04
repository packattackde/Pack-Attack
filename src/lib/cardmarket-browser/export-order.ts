import { cardmarketProductSearchUrl, cardmarketShoppingCartUrl } from './links';

export type CardmarketOrderExport = {
  pullforgeOrderId: string;
  exportedAt: string;
  shipping: {
    name: string;
    email: string;
    street: string;
    city: string;
    zip: string;
    country: string;
  };
  items: Array<{
    cardName: string;
    cardmarketSearchUrl: string;
  }>;
  cardmarketShoppingCartUrl: string;
  sellerRulesHint: string;
};

export function buildCardmarketOrderExport(order: {
  id: string;
  shippingName: string;
  shippingEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingZip: string;
  shippingCountry: string;
  items: { cardName: string }[];
}): CardmarketOrderExport {
  return {
    pullforgeOrderId: order.id,
    exportedAt: new Date().toISOString(),
    shipping: {
      name: order.shippingName,
      email: order.shippingEmail,
      street: order.shippingAddress,
      city: order.shippingCity,
      zip: order.shippingZip,
      country: order.shippingCountry,
    },
    items: order.items.map((item) => ({
      cardName: item.cardName,
      cardmarketSearchUrl: cardmarketProductSearchUrl(item.cardName),
    })),
    cardmarketShoppingCartUrl: cardmarketShoppingCartUrl(),
    sellerRulesHint: 'Germany sellers only, min 100 sales, cheapest listing.',
  };
}

export function cardmarketExportFilename(orderId: string): string {
  return `pullforge-cardmarket-${orderId.slice(-8)}.json`;
}
